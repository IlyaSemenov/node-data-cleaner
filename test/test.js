require('./setup')
const expect = require('chai').expect

const clean = require('..')
const SchemaError = clean.SchemaError
const ValidationError = clean.ValidationError

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
			await clean.string({allowObject: true})(test).should.become("test")
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
	it('should store custom cleaner validation error in empty field key', async function() {
		await clean.object({
			fields: {},
			clean(obj) {
				throw new ValidationError("bang")
			}
		})({}).should.be.rejectedWith(ValidationError, '{"":["bang"]}')
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
		})({obj: 1}).should.be.rejectedWith(ValidationError, '{"foo":["bang"]}')
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
		})({obj1: {obj2: {}}}).should.be.rejectedWith(ValidationError, '{"obj1.foo":["bang"]}')
	})
})
