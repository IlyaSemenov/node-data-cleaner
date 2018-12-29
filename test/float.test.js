const t = require('tap')
const clean = require('..'),
	{ ValidationError } = clean

t.test('pass zero', async t => {
	t.equal(await clean.float()(0), 0)
})

t.test('pass integer', async t => {
	t.equal(await clean.float()(12345), 12345)
})

t.test('pass float', async t => {
	t.equal(await clean.float()(123.67), 123.67)
})

t.test('reject string', async t => {
	await t.rejects(clean.float()('test'), ValidationError)
})

t.test('reject boolean', async t => {
	await t.rejects(clean.float()(true), ValidationError)
})

t.test('reject object', async t => {
	await t.rejects(clean.float()({}), ValidationError)
})

t.test('cast string if cast allowed', async t => {
	t.equal(await clean.float({ cast: true })('123.45'), 123.45)
})

t.test('not allow bad string', async t => {
	await t.rejects(clean.float({ cast: true })('bummer'), ValidationError)
})

t.test('not allow empty string', async t => {
	await t.rejects(clean.float({ cast: true })(''), ValidationError)
})

t.test('allow empty string if null is allowed', async t => {
	t.equal(await clean.float({ cast: true, null: true })(''), null)
})

t.test('allow empty string if default is null', async t => {
	t.equal(await clean.float({ cast: true, default: null })(''), null)
})

t.test(
	'not allow empty string if null is allowed but cast is disabled',
	async t => {
		await t.rejects(clean.float({ null: true })(''), ValidationError)
	},
)

t.test('Min/max', async t => {
	await t.test('reject value < min', async t => {
		await t.rejects(clean.float({ min: 100 })(90), ValidationError)
	})
	await t.test('pass value == min', async t => {
		t.equal(await clean.float({ min: 100 })(100), 100)
	})
	await t.test('pass value > min', async t => {
		t.equal(await clean.float({ min: 100 })(101), 101)
	})
	await t.test('reject value > min', async t => {
		await t.rejects(clean.float({ max: 100 })(101), ValidationError)
	})
	await t.test('pass value == max', async t => {
		t.equal(await clean.float({ max: 100 })(100), 100)
	})
	await t.test('pass value < max', async t => {
		t.equal(await clean.float({ max: 100 })(-100), -100)
	})
})

t.test('Empty values', async t => {
	await t.test('reject undefined', async t => {
		await t.rejects(clean.float()(), ValidationError)
	})
	await t.test('pass undefined if allowed', async t => {
		t.equal(await clean.float({ required: false })(), undefined)
	})
	await t.test('reject null', async t => {
		await t.rejects(clean.float()(null), ValidationError)
	})
	await t.test('pass null if allowed', async t => {
		t.equal(await clean.float({ null: true })(null), null)
	})
})

t.test('call custom cleaner', async t => {
	t.same(
		await clean.float({
			clean(v) {
				return { value: v }
			},
		})(123.45),
		{ value: 123.45 },
	)
})
