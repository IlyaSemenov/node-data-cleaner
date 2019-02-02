import { validate as validateEmail } from 'email-validator'
import cleanString, { StringSchema } from './string'
import { ValidationError } from '../errors/ValidationError'
import { CleanerOptions } from '../types'
import { getMessage } from '../utils'
import { setSchema } from './any'

export interface EmailSchema<T, V, O> extends StringSchema<T, V, O> {}

export default function cleanEmail<
	T = string,
	V = T,
	O extends CleanerOptions = CleanerOptions
>(schema: EmailSchema<T, V, O> = {}) {
	const cleaner = cleanString<T, V, O>({
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
	return setSchema(cleaner, schema)
}
