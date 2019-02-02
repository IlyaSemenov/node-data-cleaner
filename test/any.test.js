const t = require('tap')
const clean = require('..'),
	{ SchemaError, ValidationError } = clean

t.test('pass value as is', async t => {
	const value = { foo: [1, 2, { bar: 'x' }] }
	t.same(clean.any()(value), value)
})

t.test('reject undefined', async t => {
	t.throws(() => clean.any()(), ValidationError)
	t.throws(() => clean.any()(undefined), ValidationError)
})

t.test('pass undefined if allowed', async t => {
	t.equal(clean.any({ required: false })(undefined), undefined)
})

t.test('reject null', async t => {
	t.throws(() => clean.any()(null), ValidationError)
})

t.test('pass null if allowed', async t => {
	t.equal(clean.any({ null: true })(null), null)
})

t.test('use default', async t => {
	t.same(clean.any({ default: 'test' })(undefined), 'test')
})

t.test('not use default if value provided', async t => {
	t.same(clean.any({ default: 'test' })('boom'), 'boom')
})

t.test('use default null', async t => {
	t.equal(clean.any({ default: null })(undefined), null)
})

t.test('not use default undefined', async t => {
	t.throws(() => clean.any({ default: undefined })(undefined), ValidationError)
})

t.test('reject default if required set to true', async t => {
	t.doesNotThrow(() => clean.string({ default: 123 }))
	t.doesNotThrow(() => clean.string({ default: 123, required: false }))
	t.throws(() => clean.string({ default: 123, required: true }), SchemaError)
	t.doesNotThrow(() => clean.string({ default: null }))
	t.doesNotThrow(() => clean.string({ default: null, null: true }))
	t.throws(() => clean.string({ default: null, null: false }), SchemaError)
})

t.test('custom cleaner', async t => {
	t.same(
		clean.any({
			clean(value) {
				return value * 2
			},
		})(5),
		10,
	)
})

t.test('custom async cleaner', async t => {
	t.same(
		await clean.any({
			async clean(value) {
				return new Promise(resolve => setTimeout(() => resolve(value * 2), 10))
			},
		})(5),
		10,
	)
})

t.test('saving schema', async t => {
	const schema = { null: true, default: 555 }
	t.equal(clean.any(schema).schema, schema)
})
