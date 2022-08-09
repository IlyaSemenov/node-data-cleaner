const t = require('tap')
const clean = require('..'),
	{ SchemaError, ValidationError } = clean

t.test('reject empty schema', async (t) => {
	t.throws(
		() => clean.object(),
		new SchemaError(`clean.object schema must include fields.`),
	)
})

t.test('reject schema without fields', async (t) => {
	t.throws(
		() => clean.object({}),
		new SchemaError(`clean.object schema must include fields.`),
	)
})

t.test(
	'allow schema with empty fields set and disregard passed data',
	async (t) => {
		t.same(await clean.object({ fields: {} })({ s1: 'one' }), {})
	},
)

t.test('Multiple fields', async (t) => {
	const cleaner = clean.object({
		fields: {
			s1: clean.string(),
			s2: clean.string(),
			s3: clean.string(),
		},
	})
	await t.test('pick all fields', async (t) => {
		const obj = { s1: 'one', s2: 'two', s3: 'three' }
		t.same(await cleaner(obj), obj)
	})
	await t.test('reject if some fields not present', async (t) => {
		t.rejects(
			cleaner({ s2: 'two' }),
			new ValidationError({
				s1: ['Value required.'],
				s3: ['Value required.'],
			}),
		)
	})
})

t.test('allow missing non-required field', async (t) => {
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

t.test('skip extra field', async (t) => {
	t.same(
		await clean.object({
			fields: {
				s1: clean.string(),
			},
		})({ s1: 'one', s2: 'two' }),
		{ s1: 'one' },
	)
})

t.test('accept undefined if allowed', async (t) => {
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

t.test('omit omittable boolean', async (t) => {
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

t.test('use field defaults', async (t) => {
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

t.test('call custom cleaner', async (t) => {
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

t.test('call custom async cleaner', async (t) => {
	const obj = { s1: 'one' }
	t.same(
		await clean.object({
			fields: {
				s1: clean.string(),
			},
			clean(obj) {
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({ object: obj })
					}, 1)
				})
			},
		})(obj),
		{ object: obj },
	)
})

t.test('pass plain ValidationError from custom cleaner', async (t) => {
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

t.test('store field validation errors in proper field keys', async (t) => {
	await t.rejects(
		clean.object({
			fields: {
				foo: clean.any(),
				bar: clean.any(),
			},
		})({}),
		new ValidationError({
			foo: ['Value required.'],
			bar: ['Value required.'],
		}),
	)
})

t.test(
	'store custom field cleaner validation error in proper field key',
	async (t) => {
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
	async (t) => {
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
	async (t) => {
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
	async (t) => {
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

t.test('use schema.nonFieldErrorsKey', async (t) => {
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

t.test('handle schema.nonFieldErrorsKey in nested field', async (t) => {
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

t.test('store non-grouped field errors', async (t) => {
	const cleaner = clean.object({
		fields: {
			one: clean.any(),
			two: clean.any({
				label: 'Zwei',
				clean(value) {
					if (value === 'boom') {
						throw new ValidationError('Boom is a wrong value for two!', {
							label: null,
						})
					}
					return value
				},
			}),
			three: clean.any({ label: null }),
		},
		groupErrors: false,
	})
	await t.rejects(
		cleaner({}),
		new ValidationError([
			'One: Value required.',
			'Zwei: Value required.',
			'Value required.',
		]),
	)
	await t.rejects(
		cleaner({ one: 1, two: 'boom', three: 3 }),
		new ValidationError('Boom is a wrong value for two!'),
	)
})

t.test('flat field name conversion', async (t) => {
	await t.rejects(
		clean.object({
			fields: {
				longFieldName1: clean.any(),
				long_field_name2: clean.any(),
				LONG_FIELD_NAME3: clean.any(),
			},
			groupErrors: false,
		})({}),
		new ValidationError([
			'Long Field Name1: Value required.',
			'Long Field Name2: Value required.',
			'Long Field Name3: Value required.',
		]),
	)
})

t.test('disable error grouping for nested cleaners', async (t) => {
	await t.rejects(
		clean.object({
			fields: {
				data: clean.object({
					fields: {
						foo: clean.any(),
					},
				}),
			},
			groupErrors: false,
		})({ data: {} }),
		new ValidationError('Data: Foo: Value required.'),
	)
})

t.test('flatten field error messages from custom cleaner', async (t) => {
	await t.rejects(
		clean.object({
			groupErrors: false,
			fields: {
				foo: clean.any(),
			},
			clean() {
				throw new ValidationError({ custom_field: 'Boom' })
			},
		})({ foo: 1 }),
		new ValidationError('Custom Field: Boom'),
	)
})

t.test(
	'flatten field error messages from custom cleaner - reusing field labels',
	async (t) => {
		await t.rejects(
			clean.object({
				groupErrors: false,
				fields: {
					foo: clean.any({ label: 'Moo' }),
				},
				clean() {
					throw new ValidationError({ foo: 'Boom' })
				},
			})({ foo: 1 }),
			new ValidationError('Moo: Boom'),
		)
	},
)

t.test(
	'disable label when flatten field error messages from custom cleaner',
	async (t) => {
		await t.rejects(
			clean.object({
				groupErrors: false,
				fields: {
					foo: clean.any(),
				},
				clean() {
					throw new ValidationError({ custom_field: 'Boom' }, { label: null })
				},
			})({ foo: 1 }),
			new ValidationError('Boom'),
		)
	},
)

t.test('flatten field error messages from nested custom cleaner', async (t) => {
	await t.rejects(
		clean.object({
			groupErrors: false,
			fields: {
				data: clean.object({
					label: null,
					fields: {
						foo: clean.any(),
					},
					clean() {
						throw new ValidationError({ custom_field: 'Boom' })
					},
				}),
			},
		})({ data: { foo: 1 } }),
		new ValidationError('Custom Field: Boom'),
	)
})

t.test('allow storing sibling keys from custom cleaner', async (t) => {
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

t.test('Parsing object keys', async (t) => {
	await t.test('parse keys', async (t) => {
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
	await t.test('not parse keys if not explicitly set', async (t) => {
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
	await t.test('support custom split function and keep dots', async (t) => {
		t.same(
			await clean.object({
				parseKeys: (key) => key.split('__'),
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

t.test('saving schema', async (t) => {
	const schema = { fields: {} }
	t.equal(clean.object(schema).schema, schema)
})

t.test('clean.object.simple', async (t) => {
	const cleaner = clean.object.fields({
		s1: clean.string(),
		s2: clean.string(),
		s3: clean.string(),
	})
	await t.test('pick all fields', async (t) => {
		const obj = { s1: 'one', s2: 'two', s3: 'three' }
		t.same(await cleaner(obj), obj)
	})
	await t.test('reject if some fields not present', async (t) => {
		t.rejects(
			cleaner({ s2: 'two' }),
			new ValidationError({
				s1: ['Value required.'],
				s3: ['Value required.'],
			}),
		)
	})
})
