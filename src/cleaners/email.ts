import { validate as validateEmail } from 'email-validator'
import cleanString, { StringSchema } from './string'
import { ValidationError } from '../errors/ValidationError'
import { Cleaner } from '../types'
import { getMessage } from '../utils'

export interface EmailSchema<T, V> extends StringSchema<T, V> {}

export default function cleanEmail<T = string, V = T>(
	schema: EmailSchema<T, V> = {},
): Cleaner<T, V> {
	return cleanString<T, V>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		blank: schema.blank,
		cast: true,
		clean(value, opts) {
			let res: any = value
			if (!(res === undefined || res === null || res === '')) {
				if (!validateEmail(res)) {
					throw new ValidationError(
						getMessage(opts, 'invalid_email', 'Invalid e-mail address.'),
					)
				}
			}
			if (schema.clean) {
				res = schema.clean(res, opts)
			}
			return res
		},
	})
}
