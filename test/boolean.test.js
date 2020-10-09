const t = require('tap')
const clean = require('..'),
	{ ValidationError } = clean

t.test('pass true', async (t) => {
	t.equal(clean.boolean()(true), true)
})

t.test('pass false', async (t) => {
	t.equal(clean.boolean()(false), false)
})

t.test('pass undefined for false if omit enabled', async (t) => {
	t.equal(clean.boolean({ omit: true })(false), undefined)
})

t.test('pass true if omit enabled', async (t) => {
	t.equal(clean.boolean({ omit: true })(true), true)
})

t.test('reject string', async (t) => {
	t.throws(() => clean.boolean()('test'), new ValidationError('Invalid value.'))
})

t.test('reject number', async (t) => {
	t.throws(() => clean.boolean()(0), new ValidationError('Invalid value.'))
})

t.test('reject object', async (t) => {
	t.throws(() => clean.boolean()({}), new ValidationError('Invalid value.'))
})

t.test('cast string if cast allowed', async (t) => {
	t.equal(clean.boolean({ cast: true })('test'), true)
})

t.test('cast empty string if cast allowed', async (t) => {
	t.equal(clean.boolean({ cast: true })(''), false)
})

t.test('cast object if cast allowed', async (t) => {
	t.equal(clean.boolean({ cast: true })({}), true)
})

t.test('cast number if cast allowed', async (t) => {
	t.equal(clean.boolean({ cast: true })(1), true)
})

t.test('cast zero if cast allowed', async (t) => {
	t.equal(clean.boolean({ cast: true })(0), false)
})

t.test('Empty values', async (t) => {
	await t.test('reject undefined', async (t) => {
		t.throws(() => clean.boolean()(), new ValidationError('Value required.'))
	})
	await t.test('pass undefined if allowed', async (t) => {
		t.equal(clean.boolean({ required: false })(), undefined)
	})
	await t.test('reject null', async (t) => {
		t.throws(
			() => clean.boolean()(null),
			new ValidationError('Value required.'),
		)
	})
	await t.test('pass null if allowed', async (t) => {
		t.equal(clean.boolean({ null: true })(null), null)
	})
})

t.test('call custom cleaner', async (t) => {
	t.same(
		clean.boolean({
			clean(v) {
				return { value: v }
			},
		})(true),
		{ value: true },
	)
})

t.test('saving schema', async (t) => {
	const schema = { omit: true }
	t.equal(clean.boolean(schema).schema, schema)
})
