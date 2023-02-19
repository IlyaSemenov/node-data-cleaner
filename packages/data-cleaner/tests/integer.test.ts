import { clean, ValidationError } from "data-cleaner"
import t from "tap"

t.test("pass zero", async (t) => {
	t.equal(clean.integer()(0), 0)
})

t.test("pass integer", async (t) => {
	t.equal(clean.integer()(12345), 12345)
})

t.test("convert float to integer", async (t) => {
	t.equal(clean.integer()(123.67), 123)
})

t.test("reject string", async (t) => {
	t.throws(() => clean.integer()("test"), new ValidationError("Invalid value."))
})

t.test("reject boolean", async (t) => {
	t.throws(() => clean.integer()(true), new ValidationError("Invalid value."))
})

t.test("reject object", async (t) => {
	t.throws(() => clean.integer()({}), new ValidationError("Invalid value."))
})

t.test("cast string if cast allowed", async (t) => {
	t.equal(clean.integer({ cast: true })("123.45"), 123)
})

t.test("reject bad string", async (t) => {
	t.throws(
		() => clean.integer({ cast: true })("bummer"),
		new ValidationError("Invalid value.")
	)
})

t.test("reject empty string", async (t) => {
	t.throws(
		() => clean.integer({ cast: true })(""),
		new ValidationError("Invalid value.")
	)
})

t.test("allow empty string if null is allowed", async (t) => {
	t.equal(clean.integer({ cast: true, null: true })(""), null)
})

t.test("allow empty string if default is null", async (t) => {
	t.equal(clean.integer({ cast: true, default: null })(""), null)
})

t.test(
	"reject empty string if null is allowed but cast is disabled",
	async (t) => {
		t.throws(
			() => clean.integer({ null: true })(""),
			new ValidationError("Invalid value.")
		)
	}
)

t.test("Min/max", async (t) => {
	await t.test("reject value < min", async (t) => {
		t.throws(
			() => clean.integer({ min: 100 })(90),
			new ValidationError("Value too low.")
		)
	})
	await t.test("pass value === min", async (t) => {
		t.equal(clean.integer({ min: 100 })(100), 100)
	})
	await t.test("pass value > min", async (t) => {
		t.equal(clean.integer({ min: 100 })(101), 101)
	})
	await t.test("pass value < max", async (t) => {
		t.equal(clean.integer({ max: 100 })(-100), -100)
	})
	await t.test("pass value === max", async (t) => {
		t.equal(clean.integer({ max: 100 })(100), 100)
	})
	await t.test("reject value > max", async (t) => {
		t.throws(
			() => clean.integer({ max: 100 })(101),
			new ValidationError("Value too high.")
		)
	})
})

t.test("Empty values", async (t) => {
	await t.test("reject undefined", async (t) => {
		t.throws(() => clean.integer()(), new ValidationError("Value required."))
	})
	await t.test("pass undefined if allowed", async (t) => {
		t.equal(clean.integer({ required: false })(), undefined)
	})
	await t.test("reject null", async (t) => {
		t.throws(
			() => clean.integer()(null),
			new ValidationError("Value required.")
		)
	})
	await t.test("pass null if allowed", async (t) => {
		t.equal(clean.integer({ null: true })(null), null)
	})
})

t.test("call custom cleaner", async (t) => {
	t.same(
		clean.integer({
			clean(v) {
				return { value: v }
			},
		})(123),
		{ value: 123 }
	)
})

t.test("saving schema", async (t) => {
	const schema = {}
	t.equal(clean.integer(schema).schema, schema)
})
