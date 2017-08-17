# data-cleaner for Node.js

This is yet another data object validator and transformer for Node.js, inspired by Django forms validation framework.

It is intended to be used in SPA API or form submit handlers, and focuses on the following goals:

* easily validate fields with *custom* business rules (including async checks involving database access) without additional boilerplate
* maximize code reuse betwen validation and further data processing
* collect validation errors for the UI

## How it works

A configured *cleaner* accepts some value (typically a data object coming from insecure API client), validates and transforms it into cleaned version, field by field. Every field may run through a predefined sub-cleaner, or a custom ad-hoc cleaner, or easily combine both methods. All cleaners can be (but don't have to be) asynchronous and return a promise.

A cleaner either returns a fully cleaned object, or throws a `ValidationError` combining all errors associated to respective fields.

## Why not avj/joi/yup/etc.?

See [Comparison to other libraries](#comparison-to-other-libraries) below.

## Example

```js
import clean, { ValidationError } from 'data-cleaner'

// Define a cleaner for imaginary department visitor registration form with fields:
// - Name
// - Gender
// - Email
// - Department

// Use imaginary async data access library for the validation.

const cleanVisitorData = clean.object({
  fields: {
    name: clean.string(), // Name must be a proper non-blank string.
    gender: g => {
      // Gender must be male or female
      if (g == 'male' || g == 'female') {
        return g
      }
      raise ValidationError("Invalid gender.")
    },
    email: clean.string({ // Email must be a proper non-blank string.
      async clean(email) {
        // Email must be valid.
        if (!isEmail(email)) {
          throw new ValidationError("Invalid email address.")
        }
        // Email must not be already registered.
        if (await User.findByEmail(email)) {
          throw new ValidationError(
            `User with email ${email} already registered.`
          )
        }
        return email
      },
    }),
    department: clean.integer({
      async clean(depId) {
        // Transform department from id to model object.
        const dep = await Department.findById(depId)
        if (!dep) {
          throw new ValidationError("Invalid value.")
        }
        return dep
      }
    }),
  },
  clean(visitor) {
    // If all object fields validated, run it through additional cleaner.
    if (visitor.department.isFemaleOnly && visitor.gender != 'female') {
      throw new ValidationError({
        department: `Only women allowed in ${department.name}.`
      })
    }
    return visitor
  }
})

// Use the cleaner in imaginary API handler

router.post('/register', async ctx => {
  let data
  try {
    data = await cleanVisitorData(ctx.request.body)
  } catch (err) {
    if (err instanceof ValidationError) {
      // err.errors = {
      //   field1: ['err1', 'err2', ...],
      //   field2: ['err3'],
      //   ...
      // }
      ctx.body = {errors: err.errors}
      return
    }
    throw e
  }
  // data is guaranteed to be an object
  // data.name will be non empty string
  // data.gender will be either 'male' or 'female'
  // data.email will be a valid email
  // data.department will be an instance of class Department
  // It is guaranteed that if data.department.isFemaleOnly then data.gender is 'female'
  ctx.body = {user: await User.insert(data)}
})
```

## Comparison to other libraries

Why don't just use ajv or other popular solutions?

These are great tools, but they are often misused. Like, when you have a hammer everything looks like a nail. For example, json-schema validators do only that - they validate an object against a schema. However, if you build a API server for SPA, the real everyday needs are typically wider than that:

* You need to validate data according to custom business rules, including database access
* You need to avoid repeating the same code in validation and in further object processing
* You need to generate user-friendly error messages to send back to the UI (and put them alongside the corresponding form fields)

data-cleaner is aimed to these specific needs, rather than a low-level or academic task of *validating against a schema*.

### Typically, validators only *validate* objects but don't *transform* them

In the example above, node-validator validates department ID and returns a Department object in a single piece of code.

If you use a validor, you will need to hit the database **twice** (first in the validator, then in the business code.)

### Custom validators are cumbersome

Custom fields validators are typically not first class citizens, and produce a lot of boilerplate. For example, in ajv you need to setup a global validation function:

```js
ajv.addKeyword('range', {
  type: 'number',
  compile: function (sch, parentSchema) {
    ...
```

then refer to it from your schema:

```js
var schema = { "range": [2, 4], ...
var validate = ajv.compile(schema);
```

then use it:

```js
validate(obj)
```

It's practically impossible to use aggregating validators on different levels of nested objects.

On the contrary, data-cleaner cleaners are ad-hoc for each field by design, with zero boilerplate.

### joi/yup: describing schema with chained methods is awkward

Chained method invokations (with usual linting) lead to unreadable code, it's hard to distinguish between chained invokations and different fields:

```js
name: yup.string().required(),
email: yup.string().nullable().test('is-email', "Invalid email.", email => {
  return email === null || isEmail(email)
}).test('not-used', "Email already registered.", async email => {
  if (email === null || !(await User.findByEmail(email)) {
    return true
  }
  throw new yup.ValidationError(`Email address ${email} already registered.`)
}),
phone: yup.string().nullable().transform(phone => {
  return isPhone(phone) ? normalizePhone(phone) : phone
}).test('is-phone', "Invalid phone number.", phone => {
  return phone === null || isPhone(phone)
}).test('not-used', "Phone already registered.", async phone => {
  if (phone === null || !(await User.findByPhone(phone)) {
    return true
  }
  throw new yup.ValidationError(`Phone ${phone} already registered.`)
}),
student: yup.object().shape({
```

Besides, it's too much boilerplate. For every test, you **must** invent a name (which most often will never be used) and **must** provide a error message (even when the validator generates dynamic error messages).

### yup: limited transformation options

yup *"transforms"* keep original (possibly invalid) value in case of error/type mismatch, meaning that you will *need* to have tests that manually check for data type for every field. ([You should use isType for all Schema type checks.](https://github.com/jquense/yup#mixedistypevalue-any-boolean))

Also, the whole transforms framework is disabled when you use `{strict: false}`.

Overall, this limits them to very simple cases like converting string '5' to number 5 *if possible*.

### Validation errors don't get associated with respective fields

Typically, you either get a single (first) validation error, or a flat list of all errors. This can not be used to build a user friendly UI.

On the contrary, data-cleaner collects all errors and groups them by the corresponding field:

```json
{
  "field1": ["Error"],
  "field2": ["Multiple", "Errors", "Possible"],
  "nested.field3": ["Errors thrown by a nested field"],
  "": ["Top-level errors here, similar to Django form.non_field_errors()"],
}
```

This can be directly attached back to the corresponding form fields in the UI.
