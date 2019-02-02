import { getMessage } from '../utils'
import { SchemaError } from '../errors/SchemaError'
import { ValidationError } from '../errors/ValidationError'
import cleanAny, { AnySchema, setSchema } from './any'

export interface StringSchema<T, V> extends AnySchema<T, V> {
	blank?: boolean | null
	cast?: boolean
}

export default function cleanString<T = string, V = string>(
	schema: StringSchema<T, V> = {},
) {
	if (schema.blank === null) {
		if (schema.null === undefined) {
			schema.null = true
		} else if (schema.null !== true) {
			throw new SchemaError(
				"clean.string with 'blank: null' needs 'null: true'",
			)
		}
	}
	const cleaner = cleanAny<T, V>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		clean(value, context) {
			let res: any = value
			if (!(res === undefined || res === null)) {
				if (typeof res === 'object' && schema.cast !== true) {
					throw new ValidationError(
						getMessage(context, 'invalid', 'Invalid value.'),
					)
				}
				res = String(res)
				if (res === '') {
					if (schema.blank === null) {
						res = null
					} else if (schema.blank !== true) {
						throw new ValidationError(
							getMessage(context, 'required', 'Value required.'),
						)
					}
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
