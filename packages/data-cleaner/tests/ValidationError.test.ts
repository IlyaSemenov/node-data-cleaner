import { ValidationError } from "data-cleaner"
import t from "tap"

t.test("require a parameter", async (t) => {
	t.throws(() => new ValidationError())
})

t.test("accept a string", async (t) => {
	const err = new ValidationError("bang")
	t.same(err.messages, ["bang"])
	t.equal(err.errors, undefined)
})

t.test("accept an array", async (t) => {
	const err = new ValidationError(["bang", "boom"])
	t.same(err.messages, ["bang", "boom"])
	t.equal(err.errors, undefined)
})

t.test("reject an empty array", async (t) => {
	t.throws(() => new ValidationError([]))
})

t.test("reject an array of junk", async (t) => {
	t.throws(() => new ValidationError(["bang", null]))
})

t.test("accept an object", async (t) => {
	const err = new ValidationError({ s1: "bang", s2: ["boom", "oops"] })
	t.equal(err.messages, undefined)
	t.same(err.errors, {
		s1: ["bang"],
		s2: ["boom", "oops"],
	})
})

t.test("reject an empty object", async (t) => {
	t.throws(() => new ValidationError({}))
})

t.test("reject an object of junk", async (t) => {
	t.throws(() => new ValidationError({ s1: "bang", s2: null }))
	t.throws(() => new ValidationError({ s1: "bang", s2: [null] }))
})
