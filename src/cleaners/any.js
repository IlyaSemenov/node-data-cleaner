const { getMessage } = require("../utils")
const { ValidationError } = require("../exceptions")

exports.default = function(schema = {}) {
	return async function(value, opts) {
		if (value === undefined && !(schema.required === false)) {
			throw new ValidationError(getMessage(opts, 'required', "Value required."))
		}
		if (value === null && !(schema.null === true)) {
			throw new ValidationError(getMessage(opts, 'required', "Value required."))
		}
		if (schema.clean) {
			value = schema.clean(value, opts)
		}
		return value
	}
}
