import { getMessage } from '../utils'
import { ValidationError } from '../errors/ValidationError'
import { CleanerOptions } from '../types'
import cleanAny, { AnySchema, setSchema } from './any'

export interface BooleanSchema<T, V, O> extends AnySchema<T, V, O> {
	cast?: boolean
	omit?: boolean
}

export default function cleanBoolean<
	T = boolean,
	V = T,
	O extends CleanerOptions = CleanerOptions
>(schema: BooleanSchema<T, V, O> = {}) {
	const cleaner = cleanAny<T, V, O>({
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
	return setSchema(cleaner, schema)
}
