const { getMessage } = require("../utils")
const { ValidationError } = require("../exceptions")
const cleanAny = require("./any").default

exports.default = function(schema = {}) {
	return cleanAny({
		...schema,
		clean(value, opts) {
			if (!(value === undefined || value === null)) {
				if (typeof value === "object" && !(schema.allowObject === true)) {
					throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
				}
				value = String(value)
				if (!value && !(schema.blank === true)) {
					throw new ValidationError(getMessage(opts, 'required', "Value required."))
				}
			}
			if (schema.clean) {
				value = schema.clean(value, opts)
			}
			return value
		}
	})
}
