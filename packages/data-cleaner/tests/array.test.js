const t = require("tap")
const clean = require(".."),
	{ ValidationError } = clean

t.test("pass array", async (t) => {
	t.same(await clean.array()([1, "2", 3]), [1, "2", 3])
})

t.test("reject non-array object", async (t) => {
	await t.rejects(clean.array()("boom!"), new ValidationError("Invalid value."))
})

t.test("pass array of integers", async (t) => {
	t.same(await clean.array({ element: clean.integer() })([1, 2, 3]), [1, 2, 3])
})

t.test("reject string in array of integers", async (t) => {
	await t.rejects(
		clean.array({ element: clean.integer() })([1, "2", 3]),
		new ValidationError("Invalid value.")
	)
})

t.test("allow string in array of integers if cast is allowed", async (t) => {
	t.same(
		await clean.array({ element: clean.integer({ cast: true }) })([1, "2", 3]),
		[1, 2, 3]
	)
})

t.test("Min/max", async (t) => {
	await t.test("reject too short array", async (t) => {
		await t.rejects(
			clean.array({ min: 3 })([1, 2]),
			new ValidationError("Not enough values.")
		)
	})
	await t.test("not reject just enough short array", async (t) => {
		await t.resolves(clean.array({ min: 3 })([1, 2, 3]))
	})
	await t.test("reject too long array", async (t) => {
		await t.rejects(
			clean.array({ max: 3 })([1, 2, 3, 4]),
			new ValidationError("Too many values.")
		)
	})
	await t.test("not reject just enough long array", async (t) => {
		await t.resolves(clean.array({ max: 3 })([1, 2, 3]))
	})
	await t.test("not reject properly sized array", async (t) => {
		await t.resolves(clean.array({ min: 3, max: 5 })([1, 2, 3, 4]))
	})
})

t.test("collect validation errors from all elements", async (t) => {
	await t.rejects(
		clean.array({
			element: clean.any({
				clean(value) {
					if (value) {
						throw new ValidationError("Invalid value: " + value)
					}
				},
			}),
		})(["one", "", "three"]),
		new ValidationError(["Invalid value: one", "Invalid value: three"])
	)
})

t.test("collect named validation errors from all elements", async (t) => {
	await t.rejects(
		clean.array({
			element: clean.object({
				fields: {
					user: clean.string(),
					password: clean.string({
						clean(password) {
							if (password.length < 3) {
								throw new ValidationError("Password is too short.")
							}
						},
					}),
				},
			}),
		})([
			{ user: "John", password: "1" },
			{ password: "123" },
			{ password: "1" },
		]),
		new ValidationError([
			"password: Password is too short.",
			"user: Value required.",
			"user: Value required.",
			"password: Password is too short.",
		])
	)
})

t.test("Empty values", async (t) => {
	await t.test("reject undefined", async (t) => {
		t.throws(() => clean.array()(), new ValidationError("Value required."))
	})
	await t.test("pass undefined if allowed", async (t) => {
		t.equal(await clean.array({ required: false })(), undefined)
	})
	await t.test("reject null", async (t) => {
		t.throws(() => clean.array()(null), new ValidationError("Value required."))
	})
	await t.test("pass null if allowed", async (t) => {
		t.equal(await clean.array({ null: true })(null), null)
	})
})

t.test("call custom cleaner", async (t) => {
	t.same(
		await clean.array({
			element: clean.integer(),
			clean(v) {
				return v.reverse()
			},
		})([1, 2, 3]),
		[3, 2, 1]
	)
})

t.test("saving schema", async (t) => {
	const schema = { element: clean.integer() }
	t.equal(clean.array(schema).schema, schema)
})
