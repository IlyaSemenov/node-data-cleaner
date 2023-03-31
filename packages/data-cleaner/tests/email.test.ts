import { clean, SchemaError, ValidationError } from "data-cleaner"
import t from "tap"

const email = "foo@bar.com"

t.test("Empty values", async (t) => {
	await t.test("reject undefined", async (t) => {
		t.rejects(clean.email()(), new ValidationError("Value required."))
	})
	await t.test("pass undefined if allowed", async (t) => {
		t.equal(await clean.email({ required: false })(), undefined)
	})
	await t.test("reject null", async (t) => {
		t.rejects(clean.email()(null), new ValidationError("Value required."))
	})
	await t.test("pass null if allowed", async (t) => {
		t.equal(await clean.email({ null: true })(null), null)
	})
	await t.test("reject blank string", async (t) => {
		t.rejects(clean.email()(""), new ValidationError("Value required."))
	})
	await t.test("pass blank string if allowed", async (t) => {
		t.equal(await clean.email({ blank: true })(""), "")
	})
	await t.test("convert blank to null if specified by schema", async (t) => {
		t.equal(await clean.email({ blank: null })(""), null)
	})
	await t.test(
		"not allow blank to null conversion if blank set to false",
		async (t) => {
			t.throws(
				() => clean.email({ blank: null, null: false }),
				new SchemaError(`clean.string with 'blank: null' needs 'null: true'`)
			)
			t.doesNotThrow(() => clean.email({ blank: null, null: true }))
			t.doesNotThrow(() => clean.email({ blank: null }))
		}
	)
})

t.test("pass email", async (t) => {
	t.equal(await clean.email()(email), email)
})

t.test("reject non-email", async (t) => {
	t.rejects(
		clean.email()("boom"),
		new ValidationError("Invalid e-mail address.")
	)
	t.rejects(
		clean.email()("foobar.com"),
		new ValidationError("Invalid e-mail address.")
	)
	t.rejects(
		clean.email()("foo@bar"),
		new ValidationError("Invalid e-mail address.")
	)
	t.rejects(
		clean.email()(` ${email}`),
		new ValidationError("Invalid e-mail address.")
	)
	t.rejects(
		clean.email()(`${email} `),
		new ValidationError("Invalid e-mail address.")
	)
})

t.test("call custom cleaner", async (t) => {
	t.same(
		await clean.email().clean((email) => {
			return { email }
		})(email),
		{ email }
	)
})

t.test("call custom async cleaner", async (t) => {
	t.same(
		await clean.email().clean((email) => {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve({ email })
				}, 1)
			})
		})(email),
		{ email }
	)
})
