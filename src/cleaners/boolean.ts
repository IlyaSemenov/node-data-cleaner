import { getMessage } from '../utils'
import { ValidationError } from '../errors/ValidationError'
import { cleanAny, setSchema, AnySchema } from './any'

export interface BooleanSchema<T, V> extends AnySchema<T, V> {
	cast?: boolean
	omit?: boolean
}

export function cleanBoolean<T = boolean, V = T>(
	schema: BooleanSchema<T, V> = {},
) {
	const cleaner = cleanAny<T, V>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		clean(value, context) {
			let res: any = value
			if (!(res === undefined || res === null)) {
				if (typeof res !== 'boolean' && schema.cast !== true) {
					throw new ValidationError(
						getMessage(context, 'invalid', 'Invalid value.'),
					)
				}
				res = !!res // TODO: only do this if not boolean
				if (res === false && schema.omit === true) {
					res = undefined
				}
			}
			if (schema.clean) {
				res = schema.clean(res, context)
			}
			return res
		},
	})
	return setSchema(cleaner, schema)
}
