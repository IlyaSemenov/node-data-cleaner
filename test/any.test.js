const t = require('tap')
const clean = require('..'),
	{ SchemaError, ValidationError } = clean

t.test('pass value as is', async t => {
	const value = { foo: [1, 2, { bar: 'x' }] }
	t.same(await clean.any()(value), value)
})

t.test('reject undefined', async t => {
	await t.rejects(clean.any()(), ValidationError)
	await t.rejects(clean.any()(undefined), ValidationError)
})

t.test('pass undefined if allowed', async t => {
	t.equal(await clean.any({ required: false })(undefined), undefined)
})

t.test('reject null', async t => {
	await t.rejects(clean.any()(null), ValidationError)
})

t.test('pass null if allowed', async t => {
	t.equal(await clean.any({ null: true })(null), null)
})

t.test('use default', async t => {
	t.same(await clean.any({ default: 'test' })(undefined), 'test')
})

t.test('not use default if value provided', async t => {
	t.same(await clean.any({ default: 'test' })('boom'), 'boom')
})

t.test('use default null', async t => {
	t.equal(await clean.any({ default: null })(undefined), null)
})

t.test('not use default undefined', async t => {
	await t.rejects(clean.any({ default: undefined })(undefined), ValidationError)
})

t.test('reject default if required set to true', async t => {
	await t.doesNotThrow(() => clean.string({ default: 123 }))
	await t.doesNotThrow(() => clean.string({ default: 123, required: false }))
	await t.throws(
		() => clean.string({ default: 123, required: true }),
		SchemaError,
	)
	await t.doesNotThrow(() => clean.string({ default: null }))
	await t.doesNotThrow(() => clean.string({ default: null, null: true }))
	await t.throws(
		() => clean.string({ default: null, null: false }),
		SchemaError,
	)
})

t.test('custom cleaner', async t => {
	t.same(
		await clean.any({
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
