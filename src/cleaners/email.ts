import { validate as validateEmail } from 'email-validator'

import { ValidationError } from '../errors/ValidationError'
import { getMessage } from '../utils'
import { setSchema } from './any'
import { StringSchema, cleanString } from './string'

export interface EmailSchema<T, V> extends StringSchema<T, V> {}

export function cleanEmail<T = string, V = T>(schema: EmailSchema<T, V> = {}) {
	const cleaner = cleanString<T, V>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		blank: schema.blank,
		cast: true,
		clean(value, context) {
			let res: any = value
			if (!(res === undefined || res === null || res === '')) {
				if (!validateEmail(res)) {
					throw new ValidationError(
						getMessage(context, 'invalid_email', 'Invalid e-mail address.'),
					)
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
