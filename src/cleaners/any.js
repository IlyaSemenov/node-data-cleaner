import { getMessage } from '../utils'
import ValidationError from '../exceptions/ValidationError'

export default function cleanAny(schema = {}) {
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
