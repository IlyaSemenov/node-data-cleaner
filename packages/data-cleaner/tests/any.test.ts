import { clean, SchemaError, ValidationError } from "data-cleaner"
import t from "tap"

t.test("pass value as is", async (t) => {
	const value = { foo: [1, 2, { bar: "x" }] }
	t.equal(await clean.any()(value), value)
})

t.test("reject undefined", async (t) => {
	t.rejects(() => clean.any()(), new ValidationError("Value required."))
	t.rejects(clean.any()(undefined), new ValidationError("Value required."))
})

t.test("pass undefined if allowed", async (t) => {
	t.equal(await clean.any({ required: false })(undefined), undefined)
})

t.test("reject null", async (t) => {
	t.rejects(clean.any()(null), new ValidationError("Value required."))
})

t.test("pass null if allowed", async (t) => {
	t.equal(await clean.any({ null: true })(null), null)
})

t.test("use default", async (t) => {
	t.equal(await clean.any({ default: "test" })(undefined), "test")
})

t.test("not use default if value provided", async (t) => {
	t.equal(await clean.any({ default: "test" })("boom"), "boom")
})

t.test("use default null", async (t) => {
	t.equal(await clean.any({ default: null })(undefined), null)
})

t.test("not use default undefined", async (t) => {
	t.rejects(
		clean.any({ default: undefined })(undefined),
		new ValidationError("Value required.")
	)
})

t.test("reject default if required set to true", async (t) => {
	t.doesNotThrow(() => clean.string({ default: 123 }))
	t.doesNotThrow(() => clean.string({ default: 123, required: false }))
	t.throws(
		() => clean.string({ default: 123, required: true }),
		new SchemaError(`cleanAny with 'default' needs 'required: false'`)
	)
	t.doesNotThrow(() => clean.string({ default: null }))
	t.doesNotThrow(() => clean.string({ default: null, null: true }))
	t.throws(
		() => clean.string({ default: null, null: false }),
		new SchemaError(`cleanAny with 'default: null' needs 'null: true'`)
	)
})

t.test("custom cleaner", async (t) => {
	t.equal(await clean.any().clean((value) => value * 2)(5), 10)
})

t.test("custom async cleaner", async (t) => {
	t.equal(
		await clean.any().clean((value) => {
			return new Promise((resolve) => setTimeout(() => resolve(value * 2), 10))
		})(5),
		10
	)
})
