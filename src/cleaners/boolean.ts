import { getMessage } from '../utils'
import { ValidationError } from '../errors/ValidationError'
import cleanAny, { AnySchema } from './any'
import { Cleaner } from '../types'

export interface BooleanSchema<T> extends AnySchema<T> {
	cast?: boolean
	omit?: boolean
}

export default function cleanBoolean<T = boolean | null | undefined>(schema: BooleanSchema<T> = {}): Cleaner<T> {
	return cleanAny({
		...schema as AnySchema<T>,
		clean(value, opts) {
			if (!(value === undefined || value === null)) {
				if (typeof value !== "boolean" && schema.cast !== true) {
					throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
				}
				value = !!value // TODO: only do this if not boolean
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
