import { getMessage } from '../utils'
import ValidationError from '../exceptions/ValidationError'
import cleanAny from './any'

export default function cleanInteger(schema = {}) {
	return cleanAny({
		...schema,
		clean(value, opts) {
			if (!(value === undefined || value === null)) {
				if (typeof value !== "number" && schema.cast !== true) {
					throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
				}
				if (value === "" && schema.null === true) {
					value = null
				} else {
					value = parseInt(value)
					if (isNaN(value)) {
						throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
					}
					if (schema.min !== undefined && value < schema.min) {
						throw new ValidationError(getMessage(opts, 'invalid', "Value too low."))
					}
					if (schema.max !== undefined && value > schema.max) {
						throw new ValidationError(getMessage(opts, 'invalid', "Value too high."))
					}
				}
			}
			if (schema.clean) {
				value = schema.clean(value, opts)
			}
			return value
		}
	})
}
