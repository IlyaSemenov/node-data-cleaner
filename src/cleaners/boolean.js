import { getMessage } from '../utils'
import ValidationError from '../exceptions/ValidationError'
import cleanAny from './any'

export default function cleanBoolean(schema = {}) {
	return cleanAny({
		...schema,
		clean(value, opts) {
			if (!(value === undefined || value === null)) {
				if (typeof value !== "boolean" && schema.cast !== true) {
					throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
				}
				value = !!value
				if (value === false && schema.omit === true) {
					value = undefined
				}
			}
			if (schema.clean) {
				value = schema.clean(value, opts)
			}
			return value
		}
	})
}
