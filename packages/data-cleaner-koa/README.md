# data-cleaner-koa

This is a plugin for [node-data-cleaner](https://github.com/IlyaSemenov/node-data-cleaner) for _cleaning_ Koa.js requests (or more precisely, for `koa-body@4` requests).

It will return cleaned `body` and `files`, and throw a Koa HTTP error response with `{ "errors": ... }` if there are validation errors.

## Schema options

The cleaner is configured with the following schema options:

- `body`: body cleaner (optional)
- `files`: files cleaner (optional)
- `errorCode`: HTTP status code for the failed validation response (default: 200)

## Example

Consider a registration form:

```vue
<template>
  <form ref="form" @submit.prevent="submit">
    Login: <input name="username" required /> Password:
    <input name="password" type="password" required /> Company name:
    <input name="company.name" required /> Domain:
    <input name="company.domain" required />.mysaas.com
    <button>Register</button>
    errors = {{ errors }}
  </form>
</template>

<script>
export default {
  data() {
    return {
      errors: null,
    }
  },
  methods: {
    async submit() {
      this.errors = null
      const { data } = await this.$axios.post(
        "/register",
        new FormData(this.$refs.form)
      )
      if (data.errors) {
        this.errors = data.errors
      } else {
        await this.$store.dispatch("login", data.user)
      }
    },
  },
}
</script>
```

and the corresponding backend:

```js
import * as clean from 'data-cleaner'
import 'data-cleaner-koa' // injects into data-cleaner

const cleanRegister = clean.koa({
  body: clean.object({
    parseKeys: true,
    fields: {
      username: clean.string({
        async clean (username: string) {
          const user = await User.query().select('id').where('username', username).first()
          if (user) {
            throw new clean.ValidationError('This username is not available.')
          }
          return username
        },
      }),
      password: clean.string(),
      company: clean.object({
        fields: {
          name: clean.string(),
          domain: clean.string({
            async clean (domain: string) {
              domain = domain.toLowerCase()
              if (
                domain.match(/^(www|mail|admin)/) ||
                await Company.query().select('id').where('domain', domain).first()
              ) {
                throw new clean.ValidationError('This domain is not available.')
              }
              return domain
            },
          }),
        },
      }),
    },
  }),
})

router.post('/register', async ctx => {
  const { body } = await cleanRegister(ctx)
  const user = await User.query().upsertGraphAndFetch({
    username: body.username, // will be unique (*)
    password: body.password,
    company: {
      name: body.company.name,
      domain: body.company.domain, // will be lowercase
    },
  }),
  ctx.body = user
})
```

- _NOTE: There is a race condition during unique username check, it's not handled for simplicity. For production use, wrap everything into a database transaction._

## Typescript

In the example above, `cleanKoa` will accept optional return value interface for body fields:

```ts
interface RegisterFields extends Pick<IUser, 'username' | 'password'> {
  company: Pick<ICompany, 'name' | 'domain'>
}

const cleanRegister = clean.koa<RegisterFields>({
  ...
})

const { body } = await cleanRegister(ctx) // body is a RegisterFields object
```

The `files` are currently untyped.
