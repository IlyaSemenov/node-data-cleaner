const t = require('tap')
const clean = require('..'),
	{ SchemaError, ValidationError } = clean

const uuid = '282f570c-d19c-4b85-870b-49129409ea92'

t.test('pass valid UUID', async (t) => {
	t.equal(await clean.uuid()(uuid), uuid)
})

t.test('reject invalid UUID', async (t) => {
	// Non-UUID
	t.throws(
		() => clean.uuid()('xxxxxxxx-d19c-4b85-870b-49129409ea92'),
		new ValidationError('Invalid value.'),
	)
	// UUID with debris attached
	t.throws(
		() => clean.uuid()(uuid + '1'),
		new ValidationError('Invalid value.'),
	)
	// Ignore custom regexp
	t.throws(
		() => clean.uuid({ regexp: /w/ })('x'),
		new ValidationError('Invalid value.'),
	)
})
