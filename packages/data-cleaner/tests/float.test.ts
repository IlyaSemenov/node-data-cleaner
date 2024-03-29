import { clean, ValidationError } from "data-cleaner"
import t from "tap"

t.test("pass zero", async (t) => {
	t.equal(clean.float()(0), 0)
})

t.test("pass integer", async (t) => {
	t.equal(clean.float()(12345), 12345)
})

t.test("pass float", async (t) => {
	t.equal(clean.float()(123.67), 123.67)
})

t.test("reject string", async (t) => {
	t.throws(() => clean.float()("test"), new ValidationError("Invalid value."))
})

t.test("reject boolean", async (t) => {
	t.throws(() => clean.float()(true), new ValidationError("Invalid value."))
})

t.test("reject object", async (t) => {
	t.throws(() => clean.float()({}), new ValidationError("Invalid value."))
})

t.test("cast string if cast allowed", async (t) => {
	t.equal(clean.float({ cast: true })("123.45"), 123.45)
})

t.test("reject bad string", async (t) => {
	t.throws(
		() => clean.float({ cast: true })("bummer"),
		new ValidationError("Invalid value.")
	)
})

t.test("reject empty string", async (t) => {
	t.throws(
		() => clean.float({ cast: true })(""),
		new ValidationError("Invalid value.")
	)
})

t.test("allow empty string if null is allowed", async (t) => {
	t.equal(clean.float({ cast: true, null: true })(""), null)
})

t.test("allow empty string if default is null", async (t) => {
	t.equal(clean.float({ cast: true, default: null })(""), null)
})

t.test(
	"not allow empty string if null is allowed but cast is disabled",
	async (t) => {
		t.throws(
			() => clean.float({ null: true })(""),
			new ValidationError("Invalid value.")
		)
	}
)

t.test("Min/max", async (t) => {
	await t.test("reject value < min", async (t) => {
		t.throws(
			() => clean.float({ min: 100 })(90),
			new ValidationError("Value too low.")
		)
	})
	await t.test("pass value === min", async (t) => {
		t.equal(clean.float({ min: 100 })(100), 100)
	})
	await t.test("pass value > min", async (t) => {
		t.equal(clean.float({ min: 100 })(101), 101)
	})
	await t.test("pass value < max", async (t) => {
		t.equal(clean.float({ max: 100 })(-100), -100)
	})
	await t.test("pass value === max", async (t) => {
		t.equal(clean.float({ max: 100 })(100), 100)
	})
	await t.test("reject value > max", async (t) => {
		t.throws(
			() => clean.float({ max: 100 })(101),
			new ValidationError("Value too high.")
		)
	})
})

t.test("Empty values", async (t) => {
	await t.test("reject undefined", async (t) => {
		t.throws(() => clean.float()(), new ValidationError("Value required."))
	})
	await t.test("pass undefined if allowed", async (t) => {
		t.equal(clean.float({ required: false })(), undefined)
	})
	await t.test("reject null", async (t) => {
		t.throws(() => clean.float()(null), new ValidationError("Value required."))
	})
	await t.test("pass null if allowed", async (t) => {
		t.equal(clean.float({ null: true })(null), null)
	})
})

t.test("call custom cleaner", async (t) => {
	t.same(
		clean.float({
			clean(v) {
				return { value: v }
			},
		})(123.45),
		{ value: 123.45 }
	)
})

t.test("saving schema", async (t) => {
	const schema = {}
	t.equal(clean.float(schema).schema, schema)
})
