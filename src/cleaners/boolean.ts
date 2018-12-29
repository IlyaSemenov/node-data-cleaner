import { getMessage } from '../utils'
import { ValidationError } from '../errors/ValidationError'
import cleanAny, { AnySchema } from './any'
import { Cleaner } from '../types'

export interface BooleanSchema<T, V> extends AnySchema<T, V> {
	cast?: boolean
	omit?: boolean
}

export default function cleanBoolean<T = boolean, V = T>(
	schema: BooleanSchema<T, V> = {},
): Cleaner<T, V> {
	return cleanAny<T, V>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		clean(value, opts) {
			let res: any = value
			if (!(res === undefined || res === null)) {
				if (typeof res !== 'boolean' && schema.cast !== true) {
					throw new ValidationError(
						getMessage(opts, 'invalid', 'Invalid value.'),
					)
				}
				res = !!res // TODO: only do this if not boolean
				if (res === false && schema.omit === true) {
					res = undefined
				}
			}
			if (schema.clean) {
				res = schema.clean(res, opts)
			}
			return res
		},
	})
}
