const t = require('tap')
const clean = require('..'),
	{ SchemaError, ValidationError } = clean

const email = 'foo@bar.com'

t.test('Empty values', async t => {
	await t.test('reject undefined', async t => {
		t.throws(() => clean.email()(), ValidationError)
	})
	await t.test('pass undefined if allowed', async t => {
		t.equal(clean.email({ required: false })(), undefined)
	})
	await t.test('reject null', async t => {
		t.throws(() => clean.email()(null), ValidationError)
	})
	await t.test('pass null if allowed', async t => {
		t.equal(clean.email({ null: true })(null), null)
	})
	await t.test('reject blank string', async t => {
		t.throws(() => clean.email()(''), ValidationError)
	})
	await t.test('pass blank string if allowed', async t => {
		t.equal(clean.email({ blank: true })(''), '')
	})
	await t.test('convert blank to null if specified by schema', async t => {
		t.equal(clean.email({ blank: null })(''), null)
	})
	await t.test(
		'not allow blank to null conversion if blank set to false',
		async t => {
			t.throws(() => clean.email({ blank: null, null: false }), SchemaError)
			t.doesNotThrow(() => clean.email({ blank: null, null: true }))
			t.doesNotThrow(() => clean.email({ blank: null }))
		},
	)
})

t.test('pass email', async t => {
	t.equal(clean.email()(email), email)
})

t.test('reject non-email', async t => {
	t.throws(() => clean.email()('boom'), ValidationError)
	t.throws(() => clean.email()('foobar.com'), ValidationError)
	t.throws(() => clean.email()('foo@bar'), ValidationError)
	t.throws(() => clean.email()(` ${email}`), ValidationError)
	t.throws(() => clean.email()(`${email} `), ValidationError)
})

t.test('call custom cleaner', async t => {
	t.same(
		clean.email({
			clean(email) {
				return { email }
			},
		})(email),
		{ email },
	)
})

t.test('call custom async cleaner', async t => {
	t.same(
		await clean.email({
			clean(email) {
				return new Promise(resolve => {
					setTimeout(() => {
						resolve({ email })
					}, 1)
				})
			},
		})(email),
		{ email },
	)
})

t.test('saving schema', async t => {
	const schema = {}
	t.equal(clean.email(schema).schema, schema)
})
