# DEPRECATION NOTICE

I created this library in 2017. Back then, the competitors were barely useful.

In 2023, I started working on the next major version and ended up with [PR: chainable cleaners](https://github.com/IlyaSemenov/node-data-cleaner/pull/29). While working on it, I discovered a new player in the field: [zod](https://zod.dev/). ~~Zod made things right.~~ My "chained cleaners" are basically an inferior version of Zod. And unlike my pet project, Zod has active community.

~~I am switching to Zod in my projects.~~

While Zod offered much better user experience, and I switched to using it for a time, I wasn't happy with it either.

1) Zod is not tree shakeable. It puts all its methods in the base class.
2) Zod is not consistently extensible. One can't add z.customNumber() alongside z.number().
3) Despite its popularity, it's poorly maintained. I opened a few pull requests (e.g. [Add zod.select](https://github.com/colinhacks/zod/pull/2333), [Make EnumValues generic](https://github.com/colinhacks/zod/pull/2338)) for which I never got any reaction from the maintainers in almost a year.
4) It's poorly architected. Basically, the entire Zod source code is kept in a single behemoth 6000-liner [src/types.ts](https://github.com/colinhacks/zod/blob/6c7acbc33d9b2005172da5efea95ada3c35e22ee/src/types.ts).

Then, I discovered [Valibot](https://valibot.dev/) which works similarly to Zod but is fully tree shakeable and can be extended seamlessly (which I actually do with [valibotx](https://github.com/IlyaSemenov/valibotx), my collection of Valibot extensions).

**I am switching to Valibot in all my projects.**

# data-cleaner for Node.js

This is yet another data object validator and transformer for Node.js, inspired by Django forms validation framework.

It is intended to be used in server-side API or form submit handlers, and focuses on the following goals:

- minimum boilerplate with reasonable defaults
- **easily** provide **custom** validation logic
- async/await support on every step
- not only validate values but possibly transform them or return side artifacts
- collect and group validation errors for the UI (when errors need to belong to corresponding input fields)

## Why not avj/joi/yup/etc.?

See [Comparison to other libraries](#comparison-to-other-libraries) below.

## Minimal example

```ts
import { clean } from "data-cleaner"

const cleanUser = clean.object({
  name: clean.string(),
  age: clean.integer({ required: false }),
  is_admin: clean.boolean(),
})

const data = await cleanUser(ctx.request.body)
// may throw ValidationError with errors attributed to the respective fields
// data is guaranteed to be { name: string, age?: number, is_admin: boolean }
```

See [full example](#full-example) to see more options (including asynchronous custom validation and custom error messages) in action.

## Installation

```bash
npm i data-cleaner
# or:
yarn add data-cleaner
# or:
pnpm add data-cleaner
```

Then import or require:

```ts
import { clean, ValidationError } from "data-cleaner"

// or (better tree-shakeable in some bundlers)

import * as clean from "data-cleaner"
import { ValidationError } from "data-cleaner"

// or

const { clean, ValidationError } = require("data-cleaner")
```

## API

Terms:

- [Cleaner](#cleaner)
- [Configurable cleaner](#configurable-cleaner)
- [Chainable cleaner](#chainable-cleaner)

Base cleaners:

- [`clean.any`](#cleanany) (common base for all other cleaners)

Scalar cleaners:

- [`clean.string`](#cleanstring)
- [`clean.integer`](#cleaninteger)
- [`clean.float`](#cleanfloat)
- [`clean.boolean`](#cleanboolean)
- [`clean.date`](#cleandate)
- [`clean.email`](#cleanemail)
- [`clean.uuid`](#cleanuuid)

Aggregation cleaners:

- [`clean.array`](#cleanarray)
- [`clean.object`](#cleanobject)

### Cleaner

_Cleaner_ is any function that follows the contract:

```ts
function cleanValue(value, context) {
  // either return the value as is
  // or return a transformed value
  // or throw a ValidationError("Message")
  // or throw a ValidationError(["Message 1", "Message 2"])
  // or throw a ValidationError({ field1: "Error", field2: ["Boom", "Bang"] })
  // or return a promise doing something of the above.
}
```

### Configurable cleaner

Configurable cleaner is a function that creates a cleaner according to the provided schema.

For example, `clean.string()` creates a cleaner that will accept non-blank strings only, and `clean.string({ blank: true })` creates a cleaner that will accept both blank and non-blank strings.

**All built-in cleaners are configurable.**

### Chainable cleaner

A chainable cleaner is a cleaner that can be _chained_ by calling `clean()` method on it. Cleaned values will be passed to the chained cleaner. Example:

```ts
const cleanDatabaseId = clean
  .integer({ min: 1 })
  .clean((value) => {
    // Here value is guaranteed to be an integer which is equal or greater than 1
    return "" + value
  })
  .clean((value) => {
    // There could be multiple cleaners attached
    // Here value is guaranteed to be a string
    return value
  })
```

**All built-in cleaners are chainable.**

### `clean.any()`

Create a cleaner that passes any value as is, or throws a ValidationError for `undefined` or `null`.

```ts
const c = clean.any()

await c(5) // 5
await c("5") // '5'
await c("") // ''
await c({ foo: "bar" }) // {foo: 'bar'}
await c() // throws "Value required."
await c(null) // throws "Value required."
```

#### Schema

All built-in cleaners are configurable and accept schema parameters. For example, you may allow null values with:

```ts
const c = clean.any({ null: true })

await c(null) // null
await c(undefined) // throws "Value required."
```

#### Common schema options

The following schema parameters are supported by `clean.any()` and by all other built-in cleaners.

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value

#### Providing defaults

```ts
const c = clean.any({ default: "foo" })

await c("bar") // bar
await c(undefined) // 'foo'
```

#### Passing validation context

Use cleaner `context` to pass execution context data to the nested cleaner:

```ts
const cleanPassword = clean.string().clean(async (password, { db }) => {
  const dbPassword = await db.fetch("password")
  return password === dbPassword
})

const db = await DB.getConnection()
await cleanPassword("secret", { db }) // either true or false
```

- Certain context keys (e.g. `data`) could be used by built-in cleaners.

### `clean.string()`

Create a cleaner that returns a non-blank string value.

```ts
const c = clean.string()

await c(5) // '5'
await c("5") // '5'
await c("") // throws "Value required."
await c({ foo: "bar" }) // throws "Invalid value."
await c() // throws "Value required."
await c(null) // throws "Value required."
```

#### Schema options

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value
- `blank: true` - allow blank values (empty strings)
- `blank: null` - convert blank values (empty strings) to `null` (sets `null: true` automatically)
- `cast: true` - no strict type check, convert value with `String(value)`
- `regexp` - test non-blank strings to match against regexp

#### Using chained cleaner

Example:

```ts
const cleanUrl = clean.string({ null: true }).clean(async (url) => {
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
})

await cleanUrl("https://google.com") // { url: 'https://google.com', data: '<html>...' }
await cleanUrl("abcd://boom") // throws "Invalid URL: unknown protocol 'abcd'."
await cleanUrl(null) // null
await cleanUrl(123) // throws "Invalid URL: ..."
await cleanUrl({ url: "https://google.com" }) // throws "Invalid value."
```

#### Converting empty strings to null values

If `blank` is set to `null`, empty strings are converted to `null` (useful for data input from HTML forms):

```ts
const c = clean.integer({ blank: null })
await c("") // null
```

### `clean.integer()`

Create a cleaner that returns an integer value.

```ts
const c = clean.integer()

await c(123) // 123
await c(0) // 0
await c(-5) // -5
await c(-273.15) // -273
await c("boomer") // throws "Invalid value."
await c("") // throws "Invalid value."
await c({ foo: 123 }) // throws "Invalid value."
await c() // throws "Value required."
await c(null) // throws "Value required."
```

#### Schema options

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value
- `cast: true` - no strict type check, convert value with `parseInt(value)`
- `min` - minimum allowed value
- `max` - maximum allowed value

#### Handle empty string

If `null` and `cast` are enabled, empty string will be cast to null.

### `clean.float()`

Create a cleaner that returns a float value.

```ts
const c = clean.integer()

await c(123) // 123
await c(123.45) // 123.45
await c(0) // 0
await c(-273.15) // -273.15
await c("boomer") // throws "Invalid value."
await c("") // throws "Invalid value."
await c({ foo: 123 }) // throws "Invalid value."
await c() // throws "Value required."
await c(null) // throws "Value required."
```

#### Schema options

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value
- `cast: true` - no strict type check, convert value with `parseFloat(value)`
- `min` - minimum allowed value
- `max` - maximum allowed value

#### Empty strings

If `null` and `cast` are enabled, empty string will be cast to null.

### `clean.boolean()`

Create a cleaner that returns a boolean value (that is, either `true` or `false`).

```ts
const c = clean.boolean()

await c(true) // true
await c(false) // false
await c("boomer") // throws "Invalid value."
await c("") // throws "Invalid value."
await c({ foo: "bar" }) // throws "Invalid value."
await c() // throws "Value required."
await c(null) // throws "Value required."
```

#### Schema options

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value
- `cast` - no strict type check, convert value with `!!value`
- `omit: true` - return `undefined` for `false`

### `clean.date()`

Create a cleaner that returns a Date object.

```ts
const c = clean.date()

await c("2018-11-14T09:28:19.387+07:00") // Date object
await c("non date text") // throws "Invalid value."
await c("") // throws "Value required."
await c() // throws "Value required."
await c(null) // throws "Value required."
```

#### Schema options

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value
- `blank: true` - allow blank values (empty strings)
- `blank: null` - convert blank values (empty strings) to `null` (sets `null: true` automatically)
- `format: null` - return valid value as is (instead of Date object)
- `format: 'iso'` - return ISO-formatted date (instead of Date object)

### `clean.email()`

Create an instance of a string cleaner that returns a valid email string.

```ts
const c = clean.email()

await c("user@example.com") // 'user@example.com'
await c("non email garbage") // throws "Invalid value."
await c("") // throws "Value required."
```

#### Schema options

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value
- `blank: true` - allow blank values (empty strings)
- `blank: null` - convert blank values (empty strings) to `null` (sets `null: true` automatically)
- `cast: true` - no strict type check, convert value with `String(value)`

### `clean.uuid()`

Create an instance of a string cleaner that returns a valid UUID.

```ts
const c = clean.uuid()

await c("282f570c-d19c-4b85-870b-49129409ea92") // '282f570c-d19c-4b85-870b-49129409ea92'
await c("non uuid garbage") // throws "Invalid value."
await c("") // throws "Value required."
```

#### Schema options

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value
- `blank: true` - allow blank values (empty strings)
- `blank: null` - convert blank values (empty strings) to `null` (sets `null: true` automatically)
- `cast: true` - no strict type check, convert value with `String(value)`

### `clean.array()`

Create a cleaner that returns an array of values, where each value is validated against a subcleaner.

```ts
const c = clean.array({
  element: clean.integer(),
})

await c([1, 2, 3]) // [1,2,3]
await c([]) // []
await c([1, "two", 3]) // throws "Invalid value."
await c("") // throws "Invalid value."
await c({ foo: "bar" }) // throws "Invalid value."
await c() // throws "Value required."
await c(null) // throws "Value required."
```

#### Schema options

- `required: false` - allow undefined values
- `null: true` - allow null values
- `default` - replace `undefined` with this value
- `element` - individual element cleaner
- `min` - require at least that many elements
- `max` - require at most that many elements

### `clean.object()`

Create a cleaner that validates an object by cleaning each key according to the provided fields schema. Object keys that are not present in the list of declared fields will be ignored.

```ts
const cleanUser = clean.object({
  null: true,
  fields: {
    name: clean.string(),
    email: clean.string().clean((email) => {
      if (!email.match(/.*@.*/)) {
        throw new ValidationError("Invalid email.")
      }
      return email
    }),
  },
})

await cleanUser({ name: "John", email: "a@b" }) // {name: "John", email: "a@b"}
await cleanUser({ name: "John", email: "a@b", junk: 123 }) // {name: "John", email: "a@b"}
await cleanUser({ name: "John" }) // throws {"email": ["Value required."]}
await cleanUser({ name: "John", email: "John" }) // throws {"email": ["Invalid email."]}
await cleanUser(undefined) // throws "Value required."
await cleanUser(null) // null - because explicitly allowed
await cleanUser({}) // throws {"name": ["Value required."], "email": ["Value required."]}
```

#### Schema options

- `fields` **(required)** - map of field names to their respective cleaners
- `required: false` - allow undefined values
- `default` - replace `undefined` with this value
- `null: true` - allow null values
- `groupErrors: true` - group field errors by field name
- `nonFieldErrorsKey` - if provided, non-field errors will be grouped under this pseudo field key
- `parseKeys` - create nested objects from keys like `job.position` (see below)

#### Providing field defaults

```ts
const cleanUser = clean.object({
  fields: {
    name: clean.string(),
    lastName: clean.string({ default: null }),
  },
})

await cleanUser({ name: "John", lastName: "Doe" }) // { name: "John", lastName: "Doe" }
await cleanUser({ name: "John" }) // { name: "John", lastName: null }
```

#### Shorthand syntax

If the only schema field used is `fields`, you can create a cleaner with:

```ts
const cleanUser = clean.objectFields({
  name: clean.string(),
  lastName: clean.string({ default: null }),
})

await cleanUser({ name: "John", lastName: "Doe" }) // { name: "John", lastName: "Doe" }
await cleanUser({ name: "John" }) // { name: "John", lastName: null }
```

#### Nesting object cleaners

Object cleaners can be nested:

```ts
const cleanUser = clean
  .objectFields({
    name: clean.string(),
    address: clean.objectFields({
      city: clean.string(),
      state: clean.string(),
      zip: clean.string().clean((zip) => {
        if (!zip.match(/^\d{5}$/)) {
          throw new ValidationError("Enter 5-digit ZIP code.")
        }
        return zip
      }),
    }),
  })
  .clean((user) => {
    if (user.name === "Patrick" && user.address.state === "Ohio") {
      throw new ValidationError({
        name: "You can't be named Patrick if you live in Ohio!",
      })
    }
    return user
  })

await cleanUser({
  name: "John",
  address: {
    city: "San Diego",
    state: "California",
    zip: 12345,
  },
}) // returns as is, with number 12345 converted to string "12345"

await cleanUser({ name: "John" }) // throw { "address": ["Value required."] }

await cleanUser({
  address: {
    city: "San Diego",
    state: "California",
    zip: "What's zip?",
  },
}) // throws { "name": ["Value required."], "address.zip": ["Enter 5-digit ZIP code."] }

await cleanUser({
  name: "Patrick",
  address: {
    city: "Remote Hole",
    state: "Ohio",
    zip: "12345",
  },
}) // throws { "name": ["You can't be named Patrick if you live in Ohio!"] }
```

#### Flat error collector

Grouping errors by field name can be disabled and replaced with 'flat' array of errors.
In this case, field name will be prepended to the error message, and can be overriden with using `labels` schema option and/or `label` error option.

The example below demonstrates possible scenarios:

```ts
const c = clean.object({
  fields: {
    one: clean.any(),
    two: clean.any().clean((value) => {
      if (value === "boom") {
        throw new ValidationError("Boom is a wrong value for Zwei!", {
          label: null,
        })
      }
      return value
    }),
    three: clean.any(),
  },
  labels: {
    two: "Zwei",
    three: null,
  },
  groupErrors: false,
})

await c() // throws ["One: Value required.", "Zwei: Value required.", "Value required."]
await c({ one: 1, two: "boom", three: 3 }) // throws ["Boom is a wrong value for Zwei!"] - note the omitted label.
```

#### Parse object keys and created nested objects

You can use nested object cleaner (and get nested object result) with non-nested data object by setting `parseKeys` schema parameter.

The typical use is handling POST submit:

```html
<form method="POST">
  <input name="name" value="John" />
  <input name="job.position" value="Engineer" />
</form>
```

then:

```ts
const cleanUser = clean.object({
  parseKeys: true,
  fields: {
    name: clean.string(),
    job: clean.objectFields({
      position: clean.string(),
    }),
  },
})

await cleanUser(ctx.request.body) // { name: "John", job: { position: "Engineer" } }
```

The default is to split by dot characters, like in the example above. You may pass a custom function instead, for example: `parseKeys: key => key.split('__')`

#### Setting additional data keys from a validator

```ts
const cleanComment = clean.objectFields({
  comment: clean.string(),
  postId: clean.integer().clean(async (postId, context) => {
    const post = await db.getPostById(postId)
    if (!post) {
      throw new ValidationError("Post not found.")
    }
    context.data.post = post // store fetched instance
  }),
})

await cleanComment({ postId: 123, comment: "hello" }) // { postId: 123, post: { title: "Foo" }, comment: "hello" }
```

_This option is deprecated and not supported in Typescript. The same result can be achieved with a chained cleaner pulling data from context._

## Full example

Define a _cleaner_ for imaginary department visitor registration form with the following fields:

- Name
- Gender
- Email
- Department

Use imaginary async data access library for data validation.

```ts
import { clean, ValidationError } from "data-cleaner"

const cleanVisitorData = clean
  .objectFields({
    // Name must be a proper non-blank string.
    name: clean.string(),
    // Gender must be male or female
    gender: (g) => {
      if (g === "male" || g === "female") {
        return g
      }
      throw new ValidationError("Invalid gender.")
    },
    // Email must be a proper non-blank string.
    email: clean.email().clean(async (email) => {
      // Email must not be already registered.
      if (await User.findByEmail(email)) {
        throw new ValidationError(
          `User with email ${email} already registered.`
        )
      }
      return email
    }),
    // Transform department from id to model object.
    department: clean.integer().clean(async (depId) => {
      const dep = await Department.findById(depId)
      if (!dep) {
        throw new ValidationError("Invalid value.")
      }
      return dep
    }),
  })
  .clean((visitor) => {
    // If all object fields validated, run it through additional cleaner.
    if (visitor.department.isFemaleOnly && visitor.gender !== "female") {
      throw new ValidationError({
        department: `Only women allowed in ${visitor.department.name}.`,
      })
    }
    return visitor
  })
```

Use the defined cleaner in imaginary API handler:

```ts
router.post("/register", async (ctx) => {
  const data = await cleanVisitorData(ctx.request.body).catch((err) => {
    if (err instanceof ValidationError) {
      // err.errors = {
      //   name: ['Error message 1', 'Error message 2', ...],
      //   email: ['Error message'],
      //   ...
      // }
      ctx.throw(400, { errors: err.errors })
    }
    throw err
  })
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

_NOTE: the code above mocks Koa requests handling. The actual Koa requests handling can be performed with less boilerplate using [data-cleaner-koa](https://github.com/IlyaSemenov/node-data-cleaner-koa)._

## Comparison to other libraries

Why don't just use ajv or joi/yup or other popular solutions?

These are great tools, but they are often misused. Like, when you have a hammer everything looks like a nail. json-schema validators do only that - they validate an object against a schema. However, if you build a API server for SPA, the real everyday needs are typically wider than that:

- You need to validate data according to custom business rules, including database access
- You need to avoid repeating the same code in validation and in further object processing
- You need to generate user-friendly error messages to send back to the UI (and put them alongside the corresponding form fields)

data-cleaner is aimed to these specific needs, rather than a low-level or academic task of _validating against a schema_.

### Validators only _validate_ objects but don't _transform_ them

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

### joi/yup: boilerplate

It's too much boilerplate. For every test, you **must** invent a name (which most often will never be used) and **must** provide a error message (even when the validator generates dynamic error messages).

```js
object({
  email: yup
    .string()
    .nullable()
    .test("is-email", "Invalid email.", (email) => {
      return email === null || isEmail(email)
    })
    .test("not-used", "Email already registered.", async (email) => {
      if (email === null || !(await User.findByEmail(email))) {
        return true
      }
      throw new yup.ValidationError(
        `Email address ${email} already registered.`
      )
    }),
  phone: yup
    .string()
    .nullable()
    .transform((phone) => {
      return isPhone(phone) ? normalizePhone(phone) : phone
    })
    .test("is-phone", "Invalid phone number.", (phone) => {
      return phone === null || isPhone(phone)
    })
    .test("not-used", "Phone already registered.", async (phone) => {
      // Are we actually allowed to reuse "not-used" here?
      if (phone === null || !(await User.findByPhone(phone))) {
        return true
      }
      throw new yup.ValidationError(`Phone ${phone} already registered.`)
    }),
})
```

**On the contrary, data-cleaner definition are clearly nested and as simple as possible.**

### yup: limited transformation options

yup _"transforms"_ keep original (possibly invalid) value in case of error/type mismatch, meaning that you will _have_ to manually check for data type for every field in every test (see: [You should use isType for all Schema type checks.](https://github.com/jquense/yup#mixedistypevalue-any-boolean))

yup transforms can't get any outside context from the originating code, and are generally naive. Overall, this limits them to very simple cases like converting string '5' to number 5 _if possible_ (still having to manually check if it was _not_ possible later).

**On the contrary, data-cleaner unifies validation and transformation into _cleaning_, giving flexibility and reliability.**

### Validation errors don't get associated with respective fields

Typically, you either get a single (first) validation error, or a flat list of all errors. This can not be used to build a user friendly UI where most errors belong to corresponding input fields.

**On the contrary, data-cleaner can collect all errors and group them by the corresponding field:**

```json
{
  "field1": ["Error"],
  "field2": ["Multiple", "Errors", "Possible"],
  "nested.field3": ["Errors thrown by a nested field"],
  "other": ["Top-level errors here, similar to Django form.non_field_errors()"]
}
```

This can be directly attached back to the corresponding form fields in the UI.

## Testing

```bash
git clone https://github.com/IlyaSemenov/node-data-cleaner.git
cd node-data-cleaner
yarn
yarn test
```

## Contributing

PRs and general feedback are welcome.
