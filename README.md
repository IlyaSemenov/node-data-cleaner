# data-cleaner for Node.js

This is yet another data object validator and transformer for Node.js, inspired by Django forms validation framework.

A configured cleaner accepts some value (typically a data object coming from insecure API client), validates and transforms it into cleaned version, field by field. Every field may run through a predefined cleaner, or a custom ad-hoc cleaner, or easily combine both methods. All cleaners can be (but don't have to be) asynchronous and return a promise.

The cleaner either returns a fully cleaned object, or throws a `ValidationError` combining all errors associated to respective fields.

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
    name: clean.string(), // name must be a proper non-blank string.
    gender: async gender => {
      // Gender must be male or female
      if (gender == 'male' || gender == 'female') {
        return gender
      }
      raise ValidationError("Invalid gender.")
    },
    email: clean.string({ // email must be a proper non-blank string.
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
  // It is guaranteed that if department.isFemaleOnly then data.gender is 'female'
  ctx.body = {user: await User.insert(data)}
})
```
