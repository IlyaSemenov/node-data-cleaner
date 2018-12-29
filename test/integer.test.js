const t = require('tap')
const clean = require('..'),
	{ ValidationError } = clean

t.test('pass zero', async t => {
	t.equal(await clean.integer()(0), 0)
})

t.test('pass integer', async t => {
	t.equal(await clean.integer()(12345), 12345)
})

t.test('convert float to integer', async t => {
	t.equal(await clean.integer()(123.67), 123)
})

t.test('reject string', async t => {
	await t.rejects(clean.integer()('test'), ValidationError)
})

t.test('reject boolean', async t => {
	await t.rejects(clean.integer()(true), ValidationError)
})

t.test('reject object', async t => {
	await t.rejects(clean.integer()({}), ValidationError)
})

t.test('cast string if cast allowed', async t => {
	t.equal(await clean.integer({ cast: true })('123.45'), 123)
})

t.test('not allow bad string', async t => {
	await t.rejects(clean.integer({ cast: true })('bummer'), ValidationError)
})

t.test('not allow empty string', async t => {
	await t.rejects(clean.integer({ cast: true })(''), ValidationError)
})

t.test('allow empty string if null is allowed', async t => {
	t.equal(await clean.integer({ cast: true, null: true })(''), null)
})

t.test('allow empty string if default is null', async t => {
	t.equal(await clean.integer({ cast: true, default: null })(''), null)
})

t.test(
	'not allow empty string if null is allowed but cast is disabled',
	async t => {
		await t.rejects(clean.integer({ null: true })(''), ValidationError)
	},
)

t.test('Min/max', async t => {
	await t.test('reject value < min', async t => {
		await t.rejects(clean.integer({ min: 100 })(90), ValidationError)
	})
	await t.test('pass value == min', async t => {
		t.equal(await clean.integer({ min: 100 })(100), 100)
	})
	await t.test('pass value > min', async t => {
		t.equal(await clean.integer({ min: 100 })(101), 101)
	})
	await t.test('reject value > min', async t => {
		await t.rejects(clean.integer({ max: 100 })(101), ValidationError)
	})
	await t.test('pass value == max', async t => {
		t.equal(await clean.integer({ max: 100 })(100), 100)
	})
	await t.test('pass value < max', async t => {
		t.equal(await clean.integer({ max: 100 })(-100), -100)
	})
})

t.test('Empty values', async t => {
	await t.test('reject undefined', async t => {
		await t.rejects(clean.integer()(), ValidationError)
	})
	await t.test('pass undefined if allowed', async t => {
		t.equal(await clean.integer({ required: false })(), undefined)
	})
	await t.test('reject null', async t => {
		await t.rejects(clean.integer()(null), ValidationError)
	})
	await t.test('pass null if allowed', async t => {
		t.equal(await clean.integer({ null: true })(null), null)
	})
})

t.test('call custom cleaner', async t => {
	t.same(
		await clean.integer({
			clean(v) {
				return { value: v }
			},
		})(123),
		{ value: 123 },
	)
})
