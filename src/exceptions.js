class SchemaError extends Error {}

class ValidationError extends Error {
	// Can be one of two:
	//
	// Field-unaware error:
	// err.messages = ['err1', 'err2', ...]

	// or field-aware error:
	// err.errors = {field1: ['err1', 'err2', ...], field2: ['err3', ...], ...}

	constructor(err) {
		super()
		let message
		if (Array.isArray(err)) {
			this.messages = err
			this.message = JSON.stringify(this.messages)
		} else if (typeof err === "object") {
			this.errors = {}
			for (const field of Object.keys(err)) {
				const e = err[field]
				this.errors[field] = Array.isArray(e) ? e : [e]
			}
			this.message = JSON.stringify(this.errors)
		} else {
			this.messages = [err]
			this.message = err
		}
	}
}

exports.SchemaError = SchemaError
exports.ValidationError = ValidationError
