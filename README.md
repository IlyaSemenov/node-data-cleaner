# data-cleaner for Node.js

This is yet another data object validator and transformer for Node.js, inspired by Django forms validation framework.

It is intended to be used in server-side API or form submit handlers, and focuses on the following goals:

* easily validate fields with *custom* business rules (including async checks involving database access) without additional boilerplate
* maximize code reuse betwen validation and further data processing
* collect and group validation errors for the UI (when errors need to belong to corresponding input fields)

## How it works

A configured *cleaner* accepts some value (typically a data object coming from insecure API client), validates and transforms it into cleaned version, field by field. Every field may run through a predefined sub-cleaner, or a custom ad-hoc cleaner, or any combination of those. All cleaners can be (but don't have to be) asynchronous and return a promise.

A cleaner either returns a fully cleaned object, or throws a `ValidationError` combining all errors associated to respective fields.

## Why not avj/joi/yup/etc.?

See [Comparison to other libraries](#comparison-to-other-libraries) below.

## Example

Define a *cleaner* for imaginary department visitor registration form with the following fields:

- Name
- Gender
- Email
- Department

Use imaginary async data access library for data validation.

```js
import clean, { ValidationError } from 'data-cleaner'

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
    if (visitor.department.isFemaleOnly && visitor.gender !== 'female') {
      throw new ValidationError({
        department: `Only women allowed in ${visitor.department.name}.`
      })
    }
    return visitor
  }
})
```

Use the defined cleaner in imaginary API handler:

```js
router.post('/register', async ctx => {
  let data
  try {
    data = await cleanVisitorData(ctx.request.body)
  } catch (err) {
    if (err instanceof ValidationError) {
      // err.errors = {
      //   name: ['Error message 1', 'Error message 2', ...],
      //   email: ['Error message'],
      //   ...
      // }
      ctx.body = { errors: err.errors }
      return
    }
    throw err
  }
  // data here is guaranteed to be an object
  // data.name will be a non-blank string
  // data.gender will be either 'male' or 'female'
  // data.email will be a valid email
  // data.department will be an instance of class Department
  // It is also guaranteed that if data.department.isFemaleOnly
  // then data.gender is 'female'
  ctx.body = { ok: true, user: await User.insert(data) }
})
```

## Installation

Use npm:

```bash
npm install data-cleaner
```

Then import or require:

```js
import clean, { ValidationError } from 'data-cleaner'

// or

const clean = require('data-cleaner'), ValidationError = clean.ValidationError
```

## API

### Cleaners

*Cleaner* is any function that follows the contract:

```js
function cleaner (value, opts) {
  // either return the value as is
  // or return a transformed value
  // or throw a ValidationError("Message")
  // or throw a ValidationError(["Message 1", "Message 2"])
  // or throw a ValidationError({ field1: "Error", field2: ["Boom", "Bang"] })
  // or return a promise doing something of the above.
}
```

### Cleaner creators

*Cleaner creator* is a function that creates a cleaner according to the provided schema.

For example, `clean.string()` creates a cleaner that will accept non-blank strings only, and `clean.string({ blank: true })` creates a cleaner that will accept both blank and non-blank strings.

### Built-in cleaner creators

* [`clean.any`](#cleanany) (common base for all other creators)
* [`clean.string`](#cleanstring)
* [`clean.integer`](#cleaninteger)
* [`clean.float`](#cleanfloat)
* [`clean.boolean`](#cleanboolean)
* [`clean.object`](#cleanobject) (the most important aggregation cleaner)

### `clean.any()`

Create a cleaner that passes any value as is, or throws a ValidationError for `undefined` or `null`.

```js
const cleaner = clean.any()

await cleaner(5) // 5
await cleaner('5') // '5'
await cleaner('') // ''
await cleaner({ foo: 'bar' }) // {foo: 'bar'}
await cleaner() // throws "Value required."
await cleaner(null) // throws "Value required."
```

#### Schema

All built-in cleaner creators accept schema parameters. For example, you may allow null values with:

```js
const cleaner = clean.any({
  null: true
})

await cleaner(null) // null
await cleaner(undefined) // throws "Value required."
```

#### Supported schema parameters

The following schema parameters are supported by `clean.any()` and by all other built-in cleaner creators.

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value (sets `required: false` automatically)
- `clean` - custom cleaner to run if the validation passes

#### Providing defaults

```js
const cleaner = clean.any({ default: 'foo' })

await cleaner('bar') // bar
await cleaner() // 'foo'
```

#### Using custom cleaner

Example how to pass a custom cleaner:

```js
const cleaner = clean.any({
  clean: function (password) {
    return (password === 'secret') ? 'good' : 'bad'
  }
})

await cleaner('hacker') // 'bad'
await cleaner('secret') // 'good'
await cleaner(null) // throws "Value required."
```

#### Passing validation context

Use cleaner's `opts.context` to pass execution context data to the nested cleaner:

```js
const cleaner = clean.any({
  async clean (password, opts) {
    const dbPassword = await opts.context.db.fetch('password')
    return (password === dbPassword) ? 'good' : 'bad'
  }
})

const db = await DB.getConnection()
await cleaner('secret', { context: { db } }) // either 'good' or 'bad'
```

### `clean.string()`

Create a cleaner that returns a non-blank string value.

```js
const cleaner = clean.string()

await cleaner(5) // '5'
await cleaner('5') // '5'
await cleaner('') // throws "Value required."
await cleaner({ foo: 'bar' }) // throws "Invalid value."
await cleaner() // throws "Value required."
await cleaner(null) // throws "Value required."
```

#### Supported schema parameters

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value (sets `required: false` automatically)
- `blank: true` - allow blank values (empty strings)
- `blank: null` - convert blank values (empty strings) to `null` (sets `null: true` automatically)
- `cast: true` - no strict type check, convert value with `String(value)`
- `clean` - custom cleaner to run if the validation passes

#### Using custom cleaner

Example:

```js
const cleanUrl = clean.string({
  null: true,
  clean: async function(url) {
    if (url === null) {
      return null
    }
    let data
    try {
      data = await fetch(url)
    } catch (err) {
      throw new ValidationError(`Invalid URL: ${err.message}`)
    }
    return { url, data }
  }
})

cleanUrl('http://google.com') // { url: 'http://google.com', data: '<html>...' }
cleanUrl('abcd://boom') // throws "Invalid URL: unknown protocol 'abcd'."
cleanUrl(null) // null
cleanUrl(123) // throws "Invalid URL: ..."
cleanUrl({ url: 'http://google.com' }) // throws "Invalid value."
```

#### Converting empty strings to null values

If `blank` is set to `null`, empty strings are converted to `null` (useful for data input from HTML forms):

```js
const cleaner = clean.integer({ blank: null })
await cleaner('') // null
```

### `clean.integer()`

Create a cleaner that returns an integer value.

```js
const cleaner = clean.integer()

await cleaner(123) // 123
await cleaner(0) // 0
await cleaner(-5) // -5
await cleaner(-273.15) // -273
await cleaner('boomer') // throws "Invalid value."
await cleaner('') // throws "Invalid value."
await cleaner({ foo: 123 }) // throws "Invalid value."
await cleaner() // throws "Value required."
await cleaner(null) // throws "Value required."
```

#### Supported schema parameters

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value (sets `required: false` automatically)
- `cast: true` - no strict type check, convert value with `parseInt(value)`
- `min` - minimum allowed value
- `max` - maximum allowed value
- `clean` - custom cleaner to run if the validation passes

### `clean.float()`

Create a cleaner that returns a float value.

```js
const cleaner = clean.integer()

await cleaner(123) // 123
await cleaner(123.45) // 123.45
await cleaner(0) // 0
await cleaner(-273.15) // -273.15
await cleaner('boomer') // throws "Invalid value."
await cleaner('') // throws "Invalid value."
await cleaner({ foo: 123 }) // throws "Invalid value."
await cleaner() // throws "Value required."
await cleaner(null) // throws "Value required."
```

#### Supported schema parameters

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value (sets `required: false` automatically)
- `cast: true` - no strict type check, convert value with `parseFloat(value)`
- `min` - minimum allowed value
- `max` - maximum allowed value
- `clean` - custom cleaner to run if the validation passes

### `clean.boolean()`

Create a cleaner that returns a boolean value (that is, either `true` or `false`).

```js
const cleaner = clean.boolean()

await cleaner(true) // true
await cleaner(false) // false
await cleaner('boomer') // throws "Invalid value."
await cleaner('') // throws "Invalid value."
await cleaner({ foo: 'bar' }) // throws "Invalid value."
await cleaner() // throws "Value required."
await cleaner(null) // throws "Value required."
```

#### Supported schema parameters

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value (sets `required: false` automatically)
- `cast` - no strict type check, convert value with `!!value`
- `omit: true` - return `undefined` for `false`
- `clean` - custom cleaner to run if the validation passes

### `clean.object()`

Create a cleaner that validates an object by cleaning each key according to the provided fields schema. Object keys that are not present in the list of declared fields are thrown away.

```js
const cleaner = clean.object({
  null: true,
  fields: {
    name: clean.string(),
    email: clean.string({
      clean: function(email) {
        if (email.match(/.*@.*/)) {
          return email
        }
        throw new ValidationError("Invalid email.")
      }
    }),
  }
})

cleaner({name: "John", email: "a@b"}) // {name: "John", email: "a@b"}
cleaner({name: "John", email: "a@b", junk: 123}) // {name: "John", email: "a@b"}
cleaner({name: "John"}) // throws {"email": ["Value required."]}
cleaner({name: "John", email: "John"}) // throws {"email": ["Invalid email."]}
cleaner(undefined) // throws "Value required."
cleaner(null) // null - because explicitly allowed
cleaner({}) // throws {"name": ["Value required."], "email": ["Value required."]}
```

#### Supported schema parameters

- `fields` **(required)** - map of field names to their respective cleaners
- `required: false` - allow undefined values
- `default` - replace `undefined` with this value (sets `required: false` automatically)
- `null: true` - allow null values
- `nonFieldErrorsKey` - if provided, non-field errors will be grouped under this pseudo field key
- `clean` - custom cleaner to run if the validation passes

#### Providing field defaults

```js
const cleaner = clean.object({
  fields: {
    name: clean.string(),
    lastName: clean.string({ default: null }),
})

cleaner({name: "John", lastName: "Doe"}) // { name: "John", lastName: "Doe" }
cleaner({name: "John"}) // { name: "John", lastName: null }
```

#### Nesting object cleaners

Object cleaners can be nested:

```js
const cleaner = clean.object({
  fields: {
    name: clean.string(),
    address: clean.object({
      fields: {
        city: clean.string(),
        state: clean.string(),
        zip: clean.string({
          clean: function(zip) {
            if (!zip.match(/^\d{5}$/)) {
              throw new ValidationError("Enter 5-digit ZIP code.")
            }
            return zip
          }
        }),
      }
    }),
  },
  clean: function(person) {
    if (person.name === "Patrick" && person.address.state === "Ohio") {
      throw new ValidationError({
        name: "You can't be named Patrick if you live in Ohio!"
      })
    }
    return person
  }
})

cleaner({
  name: "John",
  address: {
    city: "San Diego",
    state: "California",
    zip: 12345,
  },
}) // returns as is, with number 12345 converted to string "12345"

cleaner({ name: "John" }) // throw { "address": ["Value required."] }

cleaner({
  address: {
    city: "San Diego",
    state: "California",
    zip: "What's zip?",
  }
}) // throws { "name": ["Value required."], "address.zip": ["Enter 5-digit ZIP code."] }

cleaner({
  name: "Patrick",
  address: {
    city: "Remote Hole",
    state: "Ohio",
    zip: "12345",
  },
}) // throws { "name": ["You can't be named Patrick if you live in Ohio!"] }
```

To collect errors coming from top-level object custom `clean()` (or thrown when top-level object doesn't validate by the underlying `clean.any`) uniformly as a pseudo field errors, pass `nonFieldErrorsKey`:

```js
const cleaner = clean.object({
  fields: {
    s1: clean.string(),
    s2: clean.string(),
  },
  clean(obj) {
    if (obj.s1 === obj.s2) {
      throw new ValidationError("Strings must differ!")
    }
    return obj
  },
  nonFieldErrorsKey: "other"
})

cleaner() // throws { "other": ["Value required."] }
cleaner({ s1: "foo", s2: "foo" }) // throws { "other": ["Strings must differ!"] }
```

Without `nonFieldErrorsKey`, these errors will be passed as is.

#### Setting additional data keys from a validator

```js
const cleaner = clean.object({
  fields: {
    comment: clean.string(),
    postId: clean.integer({
      async clean (postId, opts) {
        const post = await db.getPostById(postId)
        if (!post) {
          throw new ValidationError("Post not found")
        }
        opts.data.post = post // store fetched instance
      }
    }),
  }
})

cleaner({ postId: 123, comment: "hello" }) // { postId: 123, post: { title: "Foo" }, comment: "hello" }
```

## Comparison to other libraries

Why don't just use ajv or joi/yup or other popular solutions?

These are great tools, but they are often misused. Like, when you have a hammer everything looks like a nail. json-schema validators do only that - they validate an object against a schema. However, if you build a API server for SPA, the real everyday needs are typically wider than that:

* You need to validate data according to custom business rules, including database access
* You need to avoid repeating the same code in validation and in further object processing
* You need to generate user-friendly error messages to send back to the UI (and put them alongside the corresponding form fields)

data-cleaner is aimed to these specific needs, rather than a low-level or academic task of *validating against a schema*.

### Validators only *validate* objects but don't *transform* them

If you use a typical json-validor and validate some object ID, you will need to hit the database **twice** (first in the validator to validate value, then in the business code to pull data using that value.)

**On the contrary, data-cleaner allows to transform object ID and return a database object (or throw error for invalid ID), optimizing database access and reducing amount of code.**

### Custom validators are cumbersome

Custom fields validators are typically not first-class citizens, and require a lot of boilerplate. For example, in ajv you need to setup a global validation function:

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

**On the contrary, data-cleaner cleaners are ad-hoc for each field by design, with near-zero boilerplate.**

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

**On the contrary, data-cleaner definition are clearly nested and as simple as possible.**

### yup: limited transformation options

yup *"transforms"* keep original (possibly invalid) value in case of error/type mismatch, meaning that you will *have* to manually check for data type for every field in every test (see: [You should use isType for all Schema type checks.](https://github.com/jquense/yup#mixedistypevalue-any-boolean))

yup transforms can't get any outside context from the originating code, and are generally naive. Overall, this limits them to very simple cases like converting string '5' to number 5 *if possible* (still having to manually check if it was *not* possible later).

**On the contrary, data-cleaner unifies validation and transformation into *cleaning*, giving flexibility and reliability.**

### Validation errors don't get associated with respective fields

Typically, you either get a single (first) validation error, or a flat list of all errors. This can not be used to build a user friendly UI where most errors belong to corresponding input fields.

**On the contrary, data-cleaner can collect all errors and group them by the corresponding field:**

```json
{
  "field1": ["Error"],
  "field2": ["Multiple", "Errors", "Possible"],
  "nested.field3": ["Errors thrown by a nested field"],
  "other": ["Top-level errors here, similar to Django form.non_field_errors()"],
}
```

This can be directly attached back to the corresponding form fields in the UI.

## TODO

- `clean.uuid()`
- `clean.date()`
- `clean.string({ match })`

## Testing

Testing is performed with `mocha` and `chai`:

```bash
git clone https://github.com/IlyaSemenov/node-data-cleaner.git
cd node-data-cleaner
npm install
npm test
```

## Contributing

PRs and general feedback are welcome.
