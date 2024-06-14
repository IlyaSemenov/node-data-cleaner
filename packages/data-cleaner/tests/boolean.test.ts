import { clean, ValidationError } from "data-cleaner"
import t from "tap"

t.test("pass true", async (t) => {
	t.equal(await clean.boolean()(true), true)
})

t.test("pass false", async (t) => {
	t.equal(await clean.boolean()(false), false)
})

t.test("pass undefined for false if omit enabled", async (t) => {
	t.equal(await clean.boolean({ omit: true })(false), undefined)
})

t.test("pass true if omit enabled", async (t) => {
	t.equal(await clean.boolean({ omit: true })(true), true)
})

t.test("reject string", async (t) => {
	t.rejects(clean.boolean()("test"), new ValidationError("Invalid value."))
})

t.test("reject number", async (t) => {
	t.rejects(() => clean.boolean()(0), new ValidationError("Invalid value."))
})

t.test("reject object", async (t) => {
	t.rejects(() => clean.boolean()({}), new ValidationError("Invalid value."))
})

t.test("cast string if cast allowed", async (t) => {
	t.equal(await clean.boolean({ cast: true })("test"), true)
})

t.test("cast empty string if cast allowed", async (t) => {
	t.equal(await clean.boolean({ cast: true })(""), false)
})

t.test("cast object if cast allowed", async (t) => {
	t.equal(await clean.boolean({ cast: true })({}), true)
})

t.test("cast number if cast allowed", async (t) => {
	t.equal(await clean.boolean({ cast: true })(1), true)
})

t.test("cast zero if cast allowed", async (t) => {
	t.equal(await clean.boolean({ cast: true })(0), false)
})

t.test("Empty values", async (t) => {
	await t.test("reject undefined", async (t) => {
		t.rejects(clean.boolean()(), new ValidationError("Value required."))
	})
	await t.test("pass undefined if allowed", async (t) => {
		t.equal(await clean.boolean({ required: false })(), undefined)
	})
	await t.test("reject null", async (t) => {
		t.rejects(clean.boolean()(null), new ValidationError("Value required."))
	})
	await t.test("pass null if allowed", async (t) => {
		t.equal(await clean.boolean({ null: true })(null), null)
	})
})

t.test("call custom cleaner", async (t) => {
	t.same(
		await clean.boolean().clean((value) => {
			return { some: value }
		})(true),
		{ some: true }
	)
})
