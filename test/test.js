require('./setup')
const expect = require('chai').expect

const clean = require('..')
const { SchemaError, ValidationError } = clean

describe('Any', function () {
	it('should pass value as is', async function () {
		const value = {foo: [1, 2, 3]}
		await clean.any()(value).should.become(value)
	})
	describe("Empty values", function () {
		it('should not accept undefined', async function () {
			await clean.any()().should.be.rejectedWith(ValidationError)
		})
		it('should pass undefined if allowed', async function () {
			await clean.any({required: false})().should.become(undefined)
		})
		it('should not accept null', async function () {
			await clean.any()(null).should.be.rejectedWith(ValidationError)
		})
		it('should pass null if allowed', async function () {
			await clean.any({null: true})(null).should.become(null)
		})
	})
	it('should use default', async function () {
		await clean.any({default: 'test'})().should.become('test')
	})
	it('should not use default if value provided', async function () {
		await clean.any({default: 'test'})('boom').should.become('boom')
	})
	it('should use default: null', async function () {
		await clean.any({default: null})().should.become(null)
	})
	it('should not use default: undefined', async function () {
		await clean.any({default: undefined})().should.be.rejectedWith(ValidationError)
	})
	it('should not allow default if required set to true', function () {
		expect(() => clean.string({default: 123, required: true})).to.throw(SchemaError)
		expect(() => clean.string({default: 123, required: false})).to.not.throw(SchemaError)
		expect(() => clean.string({default: null, null: false})).to.throw(SchemaError)
		expect(() => clean.string({default: null, null: true})).to.not.throw(SchemaError)
		expect(() => clean.string({default: null})).to.not.throw(SchemaError)
	})
	describe("Custom cleaner", function() {
		const value = {foo: [1, 2, 3]}
		it('should call custom cleaner', async function() {
			await clean.any({
				clean(value) {
					return {value: value}
				}
			})(value).should.become({value: value})
		})
		it('should call custom async cleaner', async function() {
			await clean.any({
				clean(value) {
					return new Promise(resolve => {
						setTimeout(() => {
							resolve({value: value})
						}, 1)
					})
				}
			})(value).should.become({value: value})
		})
	})
})

describe('String', function () {
	it('should pass string', async function () {
		await clean.string()('test').should.become('test')
	})
	it('should convert integer to string', async function () {
		await clean.string()(123).should.become('123')
	})
	describe("Empty values", function () {
		it('should not accept undefined', async function () {
			await clean.string()().should.be.rejectedWith(ValidationError)
		})
		it('should pass undefined if allowed', async function () {
			await clean.string({required: false})().should.become(undefined)
		})
		it('should not accept null', async function () {
			await clean.string()(null).should.be.rejectedWith(ValidationError)
		})
		it('should pass null if allowed', async function () {
			await clean.string({null: true})(null).should.become(null)
		})
		it('should not accept blank string', async function () {
			await clean.string()('').should.be.rejectedWith(ValidationError)
		})
		it('should pass blank string if allowed', async function () {
			await clean.string({blank: true})('').should.become('')
		})
		it('should convert blank to null if specified by schema', async function () {
			await clean.string({blank: null})('').should.become(null)
		})
		it('should not allow blank to null conversion if blank set to false', function () {
			expect(() => clean.string({blank: null, null: false})).to.throw(SchemaError)
			expect(() => clean.string({blank: null, null: true})).to.not.throw(SchemaError)
			expect(() => clean.string({blank: null})).to.not.throw(SchemaError)
		})
	})
	describe("Converting objects", function () {
		class Test {
			toString() {
				return "test"
			}
		}
		const test = new Test()
		it('should not accept object', async function () {
			await clean.string()(test).should.be.rejectedWith(ValidationError)
		})
		it('should accept object if allowed', async function () {
			await clean.string({cast: true})(test).should.become("test")
		})
	})
	describe("Custom cleaner", function() {
		it('should call custom cleaner', async function() {
			await clean.string({
				clean(s) {
					return {string: s}
				}
			})('test').should.become({string: 'test'})
		})
		it('should call custom async cleaner', async function() {
			await clean.string({
				clean(s) {
					return new Promise(resolve => {
						setTimeout(() => {
							resolve({string: s})
						}, 1)
					})
				}
			})('test').should.become({string: 'test'})
		})
	})
})

describe('Integer', function () {
	it('should pass zero', async function () {
		await clean.integer()(0).should.become(0)
	})
	it('should pass integer', async function () {
		await clean.integer()(12345).should.become(12345)
	})
	it('should convert float to integer', async function () {
		await clean.integer()(123.67).should.become(123)
	})
	it('should not accept string', async function () {
		await clean.integer()('test').should.be.rejectedWith(ValidationError)
	})
	it('should not accept boolean', async function () {
		await clean.integer()(true).should.be.rejectedWith(ValidationError)
	})
	it('should not accept object', async function () {
		await clean.integer()({}).should.be.rejectedWith(ValidationError)
	})
	it('should cast string if cast allowed', async function () {
		await clean.integer({cast: true})('123.45').should.become(123)
	})
	it('should not allow bad string', async function () {
		await clean.integer({cast: true})('bummer').should.be.rejectedWith(ValidationError)
	})
	it('should not allow empty string', async function () {
		await clean.integer({cast: true})('').should.be.rejectedWith(ValidationError)
	})
	it('should allow empty string if null is allowed', async function () {
		await clean.integer({cast: true, null: true})('').should.become(null)
	})
	it('should allow empty string if default is null', async function () {
		await clean.integer({cast: true, default: null})('').should.become(null)
	})
	it('should not allow empty string if null is allowed but cast is disabled', async function () {
		await clean.integer({null: true})('').should.be.rejectedWith(ValidationError)
	})
	describe("Min/max", function() {
		it('should reject value < min', async function () {
			await clean.integer({min: 100})(90).should.be.rejectedWith(ValidationError)
		})
		it('should pass value == min', async function () {
			await clean.integer({min: 100})(100).should.become(100)
		})
		it('should pass value > min', async function () {
			await clean.integer({min: 100})(101).should.become(101)
		})
		it('should reject value > min', async function () {
			await clean.integer({max: 100})(101).should.be.rejectedWith(ValidationError)
		})
		it('should pass value == max', async function () {
			await clean.integer({max: 100})(100).should.become(100)
		})
		it('should pass value < max', async function () {
			await clean.integer({max: 100})(-100).should.become(-100)
		})
	})
	describe("Empty values", function () {
		it('should not accept undefined', async function () {
			await clean.integer()().should.be.rejectedWith(ValidationError)
		})
		it('should pass undefined if allowed', async function () {
			await clean.integer({required: false})().should.become(undefined)
		})
		it('should not accept null', async function () {
			await clean.integer()(null).should.be.rejectedWith(ValidationError)
		})
		it('should pass null if allowed', async function () {
			await clean.integer({null: true})(null).should.become(null)
		})
	})
	describe("Custom cleaner", function() {
		it('should call custom cleaner', async function() {
			await clean.integer({
				clean(v) {
					return {value: v}
				}
			})(123).should.become({value: 123})
		})
	})
})

describe('Float', function () {
	it('should pass zero', async function () {
		await clean.float()(0).should.become(0)
	})
	it('should pass integer', async function () {
		await clean.float()(12345).should.become(12345)
	})
	it('should pass float', async function () {
		await clean.float()(123.67).should.become(123.67)
	})
	it('should not accept string', async function () {
		await clean.float()('test').should.be.rejectedWith(ValidationError)
	})
	it('should not accept boolean', async function () {
		await clean.float()(true).should.be.rejectedWith(ValidationError)
	})
	it('should not accept object', async function () {
		await clean.float()({}).should.be.rejectedWith(ValidationError)
	})
	it('should cast string if cast allowed', async function () {
		await clean.float({cast: true})('123.45').should.become(123.45)
	})
	it('should not allow bad string', async function () {
		await clean.float({cast: true})('bummer').should.be.rejectedWith(ValidationError)
	})
	it('should not allow empty string', async function () {
		await clean.float({cast: true})('').should.be.rejectedWith(ValidationError)
	})
	it('should allow empty string if null is allowed', async function () {
		await clean.float({cast: true, null: true})('').should.become(null)
	})
	it('should allow empty string if default is null', async function () {
		await clean.float({cast: true, default: null})('').should.become(null)
	})
	it('should not allow empty string if null is allowed but cast is disabled', async function () {
		await clean.float({null: true})('').should.be.rejectedWith(ValidationError)
	})
	describe("Min/max", function() {
		it('should reject value < min', async function () {
			await clean.float({min: 100})(90).should.be.rejectedWith(ValidationError)
		})
		it('should pass value == min', async function () {
			await clean.float({min: 100})(100).should.become(100)
		})
		it('should pass value > min', async function () {
			await clean.float({min: 100})(101).should.become(101)
		})
		it('should reject value > min', async function () {
			await clean.float({max: 100})(101).should.be.rejectedWith(ValidationError)
		})
		it('should pass value == max', async function () {
			await clean.float({max: 100})(100).should.become(100)
		})
		it('should pass value < max', async function () {
			await clean.float({max: 100})(-100).should.become(-100)
		})
	})
	describe("Empty values", function () {
		it('should not accept undefined', async function () {
			await clean.float()().should.be.rejectedWith(ValidationError)
		})
		it('should pass undefined if allowed', async function () {
			await clean.float({required: false})().should.become(undefined)
		})
		it('should not accept null', async function () {
			await clean.float()(null).should.be.rejectedWith(ValidationError)
		})
		it('should pass null if allowed', async function () {
			await clean.float({null: true})(null).should.become(null)
		})
	})
	describe("Custom cleaner", function() {
		it('should call custom cleaner', async function() {
			await clean.float({
				clean(v) {
					return {value: v}
				}
			})(123.45).should.become({value: 123.45})
		})
	})
})

describe('Boolean', function () {
	it('should pass true', async function () {
		await clean.boolean()(true).should.become(true)
	})
	it('should pass false', async function () {
		await clean.boolean()(false).should.become(false)
	})
	it('should pass undefined for false if omit enabled', async function () {
		await clean.boolean({ omit: true })(false).should.become(undefined)
	})
	it('should pass true if omit enabled', async function () {
		await clean.boolean({ omit: true })(true).should.become(true)
	})
	it('should not accept string', async function () {
		await clean.boolean()('test').should.be.rejectedWith(ValidationError)
	})
	it('should not accept number', async function () {
		await clean.boolean()(0).should.be.rejectedWith(ValidationError)
	})
	it('should not accept object', async function () {
		await clean.boolean()({}).should.be.rejectedWith(ValidationError)
	})
	it('should cast string if cast allowed', async function () {
		await clean.boolean({cast: true})('test').should.become(true)
	})
	it('should cast empty string if cast allowed', async function () {
		await clean.boolean({cast: true})('').should.become(false)
	})
	it('should cast object if cast allowed', async function () {
		await clean.boolean({cast: true})({}).should.become(true)
	})
	it('should cast number if cast allowed', async function () {
		await clean.boolean({cast: true})(1).should.become(true)
	})
	it('should cast zero if cast allowed', async function () {
		await clean.boolean({cast: true})(0).should.become(false)
	})
	describe("Empty values", function () {
		it('should not accept undefined', async function () {
			await clean.boolean()().should.be.rejectedWith(ValidationError)
		})
		it('should pass undefined if allowed', async function () {
			await clean.boolean({required: false})().should.become(undefined)
		})
		it('should not accept null', async function () {
			await clean.boolean()(null).should.be.rejectedWith(ValidationError)
		})
		it('should pass null if allowed', async function () {
			await clean.boolean({null: true})(null).should.become(null)
		})
	})
	describe("Custom cleaner", function() {
		it('should call custom cleaner', async function() {
			await clean.boolean({
				clean(v) {
					return {value: v}
				}
			})(true).should.become({value: true})
		})
	})
})

describe("Object", function () {
	it('should not allow empty schema', function () {
		expect(() => clean.object()).to.throw(SchemaError)
	})
	it('should not allow schema without fields', function () {
		expect(() => clean.object({})).to.throw(SchemaError)
	})
	it('should allow schema with empty fields set and disregard passed data', async function () {
		await clean.object({fields: {}})({s1: 'one'}).should.become({})
	})
	describe('Multiple fields', function () {
		const cleaner = clean.object({
			fields: {
				s1: clean.string(),
				s2: clean.string(),
				s3: clean.string(),
			}
		})
		it('should pick all fields', async function () {
			const obj = {s1: 'one', s2: 'two', s3: 'three'}
			await cleaner(obj).should.become(obj)
		});
		it('should reject if some fields not present', async function () {
			await cleaner({s2: 'two'}).should.be.rejectedWith(ValidationError, '{"s1":["Value required."],"s3":["Value required."]}')
		});
	})
	it('should not reject non-required field', async function () {
		await clean.object({
			fields: {
				s1: clean.string({
					required: false
				})
			}
		})({}).should.become({})
	})
	it('should skip extra field', async function () {
		await clean.object({
			fields: {
				s1: clean.string(),
			}
		})({s1: 'one', s2: 'two'}).should.become({s1: 'one'})
	})
	it('should accept undefined if allowed', async function () {
		await clean.object({
			required: false,
			fields: {
				s1: clean.string(),
			}
		})().should.become(undefined)
	})
    it('should omit omittable boolean', async function () {
		await clean.object({
			fields: {
				b1: clean.boolean({ omit: true }),
				b2: clean.boolean({ omit: true }),
			}
		})({ b1: false, b2: true }).should.become({ b2: true })
	})
    it('should use field defaults', async function () {
		await clean.object({
			fields: {
				s1: clean.string({ default: 'one' }),
				s2: clean.string({ default: 'two' }),
			}
		})({ s2: 'zwei' }).should.become({ s1: 'one', s2: 'zwei' })
	})
	it('should call custom cleaner', async function() {
		const obj = {s1: 'one'}
		await clean.object({
			fields: {
				s1: clean.string(),
			},
			clean(obj) {
				return {object: obj}
			}
		})(obj).should.become({object: obj})
	})
	it('should call custom async cleaner', async function() {
		const obj = {s1: 'one'}
		await clean.object({
			fields: {
				s1: clean.string(),
			},
			clean(obj) {
				return new Promise(resolve => {
					setTimeout(() => {
						resolve({object: obj})
					}, 1)
				})
			}
		})(obj).should.become({object: obj})
	})
	it('should pass plain ValidationError from custom cleaner', async function() {
		await clean.object({
			fields: {},
			clean(obj) {
				throw new ValidationError("bang")
			}
		})({}).should.be.rejectedWith(ValidationError, 'bang')
	})
	it('should store custom field cleaner validation error in proper field key', async function() {
		await clean.object({
			fields: {
				obj: clean.any({
					clean() {
						throw new ValidationError("bang")
					}
				}),
			}
		})({obj: 1}).should.be.rejectedWith(ValidationError, '{"obj":["bang"]}')
	})
	it('should store custom field cleaner field-aware validation error in proper field key', async function() {
		await clean.object({
			fields: {
				obj: clean.any({
					clean() {
						throw new ValidationError({"foo": "bang"})
					}
				}),
			}
		})({obj: 1}).should.be.rejectedWith(ValidationError, '{"obj.foo":["bang"]}')
	})
	it('should store nested object custom field cleaner validation error in proper field key', async function() {
		await clean.object({
			fields: {
				obj1: clean.object({
					fields: {
						obj2: clean.any({
							clean(obj) {
								throw new ValidationError("bang")
							}
						})
					},
				}),
			}
		})({obj1: {obj2: {}}}).should.be.rejectedWith(ValidationError, '{"obj1.obj2":["bang"]}')
	})
	it('should store nested object custom field cleaner validation error in proper field key', async function() {
		await clean.object({
			fields: {
				obj1: clean.object({
					fields: {
						obj2: clean.any({
							clean(obj) {
								throw new ValidationError({"foo": "bang"})
							}
						})
					},
				}),
			}
		})({obj1: {obj2: {}}}).should.be.rejectedWith(ValidationError, '{"obj1.obj2.foo":["bang"]}')
	})
	it('should use schema.nonFieldErrorsKey', async function() {
		await clean.object({
			fields: {},
			clean() {
				throw new ValidationError("bang")
			},
			nonFieldErrorsKey: "other"
		})({}).should.be.rejectedWith(ValidationError, '{"other":["bang"]}')
	})
	it('should handle schema.nonFieldErrorsKey in nested field', async function() {
		await clean.object({
			fields: {
				obj: clean.object({
					fields: {},
					clean() {
						throw new ValidationError("bang")
					},
					nonFieldErrorsKey: "other1"
				}),
			},
			nonFieldErrorsKey: "other"
		})({obj: {}}).should.be.rejectedWith(ValidationError, '{"obj.other1":["bang"]}')
	})
    it('should allow storing sibling keys from custom cleaner', async function() {
		await clean.object({
			fields: {
				text: clean.string(),
				postId: clean.integer({
					clean (postId, opts) {
						opts.data.post = { title: "post " + postId }
						return postId
					}
				})
			}
		})({ text: "hello", postId: 123 }).should.become({ text: "hello", postId: 123, post: { title: "post 123" } })
	})
})

describe("ValidationError", function() {
	it('should require a parameter', function() {
		expect(() => { new ValidationError() }).to.throw()
	})
	it('should accept a string', function() {
		expect(new ValidationError("bang")).to.satisfy(err => {
			return expect(err.messages).to.deep.equal(["bang"]) && expect(err.errors).to.be.undefined
		})
	})
	it('should accept an array', function() {
		expect(new ValidationError(["bang", "boom"])).to.satisfy(err => {
			return expect(err.messages).to.deep.equal(["bang", "boom"]) && expect(err.errors).to.be.undefined
		})
	})
	it('should not accept an empty array', function() {
		expect(() => { new ValidationError([]) }).to.throw()
	})
	it('should not accept an array of junk', function() {
		expect(() => { new ValidationError(["bang", null]) }).to.throw()
	})
	it('should accept an object', function() {
		expect(new ValidationError({s1: "bang", s2: ["boom", "oops"]})).to.satisfy(err => {
			return expect(err.errors).to.deep.equal({s1: ["bang"], s2: ["boom", "oops"]}) && expect(err.messages).to.be.undefined
		})
	})
	it('should not accept an empty object', function() {
		expect(() => { new ValidationError({}) }).to.throw()
	})
	it('should not accept an object of junk', function() {
		expect(() => { new ValidationError({s1: "bang", s2: null}) }).to.throw()
		expect(() => { new ValidationError({s1: "bang", s2: [null]}) }).to.throw()
	})
})
