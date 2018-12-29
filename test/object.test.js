const t = require('tap')
const clean = require('..'),
	{ SchemaError, ValidationError } = clean

t.test('not allow empty schema', async t => {
	t.throws(() => clean.object(), SchemaError)
})

t.test('not allow schema without fields', async t => {
	t.throws(() => clean.object({}), SchemaError)
})

t.test(
	'allow schema with empty fields set and disregard passed data',
	async t => {
		t.same(await clean.object({ fields: {} })({ s1: 'one' }), {})
	},
)

t.test('Multiple fields', async t => {
	const cleaner = clean.object({
		fields: {
			s1: clean.string(),
			s2: clean.string(),
			s3: clean.string(),
		},
	})
	await t.test('pick all fields', async t => {
		const obj = { s1: 'one', s2: 'two', s3: 'three' }
		t.same(await cleaner(obj), obj)
	})
	await t.test('reject if some fields not present', async t => {
		await t.rejects(
			cleaner({ s2: 'two' }),
			new ValidationError({
				s1: ['Value required.'],
				s3: ['Value required.'],
			}),
		)
	})
})

t.test('not reject non-required field', async t => {
	t.same(
		await clean.object({
			fields: {
				s1: clean.string({
					required: false,
				}),
			},
		})({}),
		{},
	)
})

t.test('skip extra field', async t => {
	t.same(
		await clean.object({
			fields: {
				s1: clean.string(),
			},
		})({ s1: 'one', s2: 'two' }),
		{ s1: 'one' },
	)
})

t.test('accept undefined if allowed', async t => {
	t.equal(
		await clean.object({
			required: false,
			fields: {
				s1: clean.string(),
			},
		})(),
		undefined,
	)
})

t.test('omit omittable boolean', async t => {
	t.same(
		await clean.object({
			fields: {
				b1: clean.boolean({ omit: true }),
				b2: clean.boolean({ omit: true }),
			},
		})({ b1: false, b2: true }),
		{ b2: true },
	)
})

t.test('use field defaults', async t => {
	t.same(
		await clean.object({
			fields: {
				s1: clean.string({ default: 'one' }),
				s2: clean.string({ default: 'two' }),
			},
		})({ s2: 'zwei' }),
		{ s1: 'one', s2: 'zwei' },
	)
})

t.test('call custom cleaner', async t => {
	const obj = { s1: 'one' }
	t.same(
		await clean.object({
			fields: {
				s1: clean.string(),
			},
			clean(obj) {
				return { object: obj }
			},
		})(obj),
		{ object: obj },
	)
})

t.test('call custom async cleaner', async t => {
	const obj = { s1: 'one' }
	t.same(
		await clean.object({
			fields: {
				s1: clean.string(),
			},
			clean(obj) {
				return new Promise(resolve => {
					setTimeout(() => {
						resolve({ object: obj })
					}, 1)
				})
			},
		})(obj),
		{ object: obj },
	)
})

t.test('pass plain ValidationError from custom cleaner', async t => {
	await t.rejects(
		clean.object({
			fields: {},
			clean(obj) {
				throw new ValidationError('bang')
			},
		})({}),
		new ValidationError('bang'),
	)
})

t.test(
	'store custom field cleaner validation error in proper field key',
	async t => {
		await t.rejects(
			clean.object({
				fields: {
					obj: clean.any({
						clean() {
							throw new ValidationError('bang')
						},
					}),
				},
			})({ obj: 1 }),
			new ValidationError({ obj: ['bang'] }),
		)
	},
)

t.test(
	'store custom field cleaner field-aware validation error in proper field key',
	async t => {
		await t.rejects(
			clean.object({
				fields: {
					obj: clean.any({
						clean() {
							throw new ValidationError({ foo: 'bang' })
						},
					}),
				},
			})({ obj: 1 }),
			new ValidationError({ 'obj.foo': ['bang'] }),
		)
	},
)

t.test(
	'store nested object custom field cleaner validation error in proper field key',
	async t => {
		await t.rejects(
			clean.object({
				fields: {
					obj1: clean.object({
						fields: {
							obj2: clean.any({
								clean(obj) {
									throw new ValidationError('bang')
								},
							}),
						},
					}),
				},
			})({ obj1: { obj2: {} } }),
			new ValidationError({ 'obj1.obj2': ['bang'] }),
		)
	},
)

t.test(
	'store nested object custom field cleaner validation error in proper field key',
	async t => {
		await t.rejects(
			clean.object({
				fields: {
					obj1: clean.object({
						fields: {
							obj2: clean.any({
								clean(obj) {
									throw new ValidationError({ foo: 'bang' })
								},
							}),
						},
					}),
				},
			})({ obj1: { obj2: {} } }),
			new ValidationError({ 'obj1.obj2.foo': ['bang'] }),
		)
	},
)

t.test('use schema.nonFieldErrorsKey', async t => {
	await t.rejects(
		clean.object({
			fields: {},
			clean() {
				throw new ValidationError('bang')
			},
			nonFieldErrorsKey: 'other',
		})({}),
		new ValidationError({ other: ['bang'] }),
	)
})

t.test('handle schema.nonFieldErrorsKey in nested field', async t => {
	await t.rejects(
		clean.object({
			fields: {
				obj: clean.object({
					fields: {},
					clean() {
						throw new ValidationError('bang')
					},
					nonFieldErrorsKey: 'other1',
				}),
			},
			nonFieldErrorsKey: 'other',
		})({ obj: {} }),
		new ValidationError({ 'obj.other1': ['bang'] }),
	)
})

t.test('allow storing sibling keys from custom cleaner', async t => {
	t.same(
		await clean.object({
			fields: {
				text: clean.string(),
				postId: clean.integer({
					clean(postId, opts) {
						opts.data.post = { title: 'post ' + postId }
						return postId
					},
				}),
			},
		})({ text: 'hello', postId: 123 }),
		{
			text: 'hello',
			postId: 123,
			post: { title: 'post 123' },
		},
	)
})

t.test('Parsing object keys', async t => {
	await t.test('parse keys', async t => {
		t.same(
			await clean.object({
				parseKeys: true,
				fields: {
					name: clean.string(),
					age: clean.integer(),
					job: clean.object({
						fields: {
							position: clean.string(),
							salary: clean.integer(),
							project: clean.object({
								fields: {
									name: clean.string(),
								},
							}),
						},
					}),
				},
			})({
				name: 'John Doe',
				age: 24,
				'job.position': 'Engineer',
				'job.salary': 50000,
				'job.project.name': 'Doomsday machine',
			}),
			{
				name: 'John Doe',
				age: 24,
				job: {
					position: 'Engineer',
					salary: 50000,
					project: {
						name: 'Doomsday machine',
					},
				},
			},
		)
	})
	await t.test('not parse keys if not explicitly set', async t => {
		t.same(
			await clean.object({
				fields: {
					foo: clean.integer(),
					'bar.baz': clean.integer(),
				},
			})({
				foo: 1,
				'bar.baz': 2,
			}),
			{
				foo: 1,
				'bar.baz': 2,
			},
		)
	})
	await t.test('support custom split function and keep dots', async t => {
		t.same(
			await clean.object({
				parseKeys: key => key.split('__'),
				fields: {
					name: clean.string(),
					age: clean.integer(),
					job: clean.object({
						fields: {
							position: clean.string(),
							salary: clean.integer(),
							'project.or.department': clean.object({
								fields: {
									name: clean.string(),
								},
							}),
						},
					}),
				},
			})({
				name: 'John Doe',
				age: 24,
				job__position: 'Engineer',
				job__salary: 50000,
				'job__project.or.department__name': 'Doomsday machine',
			}),
			{
				name: 'John Doe',
				age: 24,
				job: {
					position: 'Engineer',
					salary: 50000,
					'project.or.department': {
						name: 'Doomsday machine',
					},
				},
			},
		)
	})
})