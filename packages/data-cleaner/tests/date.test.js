const t = require("tap")
const { clean, SchemaError, ValidationError } = require("..")

const testIsoValue = "2018-11-14T09:28:19Z"
const testIsoTzValue = "2018-11-14T16:28:19+07:00"
const testDateLikeValue = "Wed, 14 Nov 2018 09:28:19 GMT"
const testValues = [testIsoValue, testIsoTzValue, testDateLikeValue]
const resultIsoValue = "2018-11-14T09:28:19.000Z"
const result = new Date(resultIsoValue)

t.test("accept UTC ISO string", async (t) => {
	t.same(clean.date()(testIsoValue), result)
})

t.test("pass timezone ISO string", async (t) => {
	t.same(clean.date()(testIsoTzValue), result)
})

t.test("accept date-like string", async (t) => {
	t.same(clean.date()(testDateLikeValue), result)
})

t.test("reject non-date-like string", async (t) => {
	t.throws(() => clean.date()("bummer"), new ValidationError("Invalid value."))
})

t.test("return UTC ISO-formatted string", async (t) => {
	const cleaner = clean.date({ format: "iso" })
	for (const value of testValues) {
		t.same(cleaner(value), resultIsoValue)
	}
})

t.test("return Date object", async (t) => {
	const cleaner = clean.date({ format: null })
	for (const value of testValues) {
		t.same(cleaner(value), value)
	}
})

// Upstream tests

t.test("Empty values", async (t) => {
	await t.test("reject undefined", async (t) => {
		t.throws(() => clean.date()(), new ValidationError("Value required."))
	})
	await t.test("pass undefined if allowed", async (t) => {
		t.equal(clean.date({ required: false })(), undefined)
	})
	await t.test("reject null", async (t) => {
		t.throws(() => clean.date()(null), new ValidationError("Value required."))
	})
	await t.test("pass null if allowed", async (t) => {
		t.equal(clean.date({ null: true })(null), null)
	})
	await t.test("reject blank string", async (t) => {
		t.throws(() => clean.date()(""), new ValidationError("Value required."))
	})
	await t.test("pass blank string if allowed", async (t) => {
		t.equal(clean.date({ blank: true })(""), "")
	})
	await t.test("convert blank to null if specified by schema", async (t) => {
		t.equal(clean.date({ blank: null })(""), null)
	})
	await t.test(
		"not allow blank to null conversion if blank set to false",
		async (t) => {
			t.throws(
				() => clean.date({ blank: null, null: false }),
				new SchemaError(`clean.string with 'blank: null' needs 'null: true'`)
			)
			t.doesNotThrow(() => clean.date({ blank: null, null: true }))
			t.doesNotThrow(() => clean.date({ blank: null }))
		}
	)
})

t.test("call custom cleaner", async (t) => {
	t.same(
		clean.date({
			clean(d) {
				return { date: d }
			},
		})(testIsoValue),
		{ date: result }
	)
})

t.test("call custom async cleaner", async (t) => {
	t.same(
		await clean.date({
			clean(d) {
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({ date: d })
					}, 1)
				})
			},
		})(testIsoValue),
		{ date: result }
	)
})

t.test("saving schema", async (t) => {
	const schema = { format: "iso" }
	t.equal(clean.date(schema).schema, schema)
})
