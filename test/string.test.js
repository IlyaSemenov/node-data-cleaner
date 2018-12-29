const t = require('tap')
const clean = require('..'),
	{ SchemaError, ValidationError } = clean

t.test('pass string', async t => {
	t.equal(await clean.string()('test'), 'test')
})

t.test('convert integer to string', async t => {
	t.equal(await clean.string()(123), '123')
})

t.test('Empty values', async t => {
	await t.test('reject undefined', async t => {
		t.throws(() => clean.string()(), ValidationError)
	})
	await t.test('pass undefined if allowed', async t => {
		t.equal(await clean.string({ required: false })(), undefined)
	})
	await t.test('reject null', async t => {
		t.throws(() => clean.string()(null), ValidationError)
	})
	await t.test('pass null if allowed', async t => {
		t.equal(await clean.string({ null: true })(null), null)
	})
	await t.test('reject blank string', async t => {
		t.throws(() => clean.string()(''), ValidationError)
	})
	await t.test('pass blank string if allowed', async t => {
		t.equal(await clean.string({ blank: true })(''), '')
	})
	await t.test('convert blank to null if specified by schema', async t => {
		t.equal(await clean.string({ blank: null })(''), null)
	})
	await t.test(
		'not allow blank to null conversion if blank set to false',
		async t => {
			t.throws(() => clean.string({ blank: null, null: false }), SchemaError)
			t.doesNotThrow(() => clean.string({ blank: null, null: true }))
			t.doesNotThrow(() => clean.string({ blank: null }), SchemaError)
		},
	)
})

t.test('Converting objects', async t => {
	class Test {
		toString() {
			return 'test'
		}
	}
	const test = new Test()
	await t.test('reject object', async t => {
		t.throws(() => clean.string()(test), ValidationError)
	})
	await t.test('accept object if allowed', async t => {
		t.equal(await clean.string({ cast: true })(test), 'test')
	})
})

t.test('call custom cleaner', async t => {
	t.same(
		await clean.string({
			clean(s) {
				return { string: s }
			},
		})('test'),
		{ string: 'test' },
	)
})

t.test('call custom async cleaner', async t => {
	t.same(
		await clean.string({
			clean(s) {
				return new Promise(resolve => {
					setTimeout(() => {
						resolve({ string: s })
					}, 1)
				})
			},
		})('test'),
		{ string: 'test' },
	)
})
