import { getMessage } from '../utils'
import ValidationError from '../exceptions/ValidationError'
import cleanAny from './any'

export default function cleanString(schema = {}) {
	return cleanAny({
		...schema,
		clean(value, opts) {
			if (!(value === undefined || value === null)) {
				if (typeof value === "object" && !(schema.cast === true)) {
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
