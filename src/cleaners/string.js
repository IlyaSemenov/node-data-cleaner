import { getMessage } from '../utils'
import SchemaError from '../exceptions/SchemaError'
import ValidationError from '../exceptions/ValidationError'
import cleanAny from './any'

export default function cleanString(schema = {}) {
	if (schema.blank === null) {
		if (schema.null === undefined) {
			schema.null = true
		} else if (schema.null !== true) {
			throw new SchemaError("clean.string with 'blank: null' needs 'null: true'")
		}
	}
	return cleanAny({
		...schema,
		clean(value, opts) {
			if (!(value === undefined || value === null)) {
				if (typeof value === "object" && schema.cast !== true) {
					throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
				}
				value = String(value)
				if (value === '') {
					if (schema.blank === null) {
						value = null
					} else if (schema.blank !== true) {
						throw new ValidationError(getMessage(opts, 'required', "Value required."))
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
