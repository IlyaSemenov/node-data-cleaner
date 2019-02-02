import cleanString, { StringSchema } from './string'
import { SchemaError } from '../errors/SchemaError'
import { ValidationError } from '../errors/ValidationError'
import { CleanerOptions } from '../types'
import { getMessage } from '../utils'
import { setSchema } from './any'

export interface DateSchema<T, V, O> extends StringSchema<T, V, O> {
	cast?: never
	format?: null | 'iso'
}

export default function cleanDate<
	T = string,
	V = T,
	O extends CleanerOptions = CleanerOptions
>(schema: DateSchema<T, V, O> = {}) {
	if (
		!(
			schema.format === undefined ||
			schema.format === null ||
			schema.format === 'iso'
		)
	) {
		throw new SchemaError(
			"clean.date result may be only: undefined, null, 'iso'",
		)
	}
	// TODO: don't allow weird combinations e.g. { format: undefined, blank: true }
	const cleaner = cleanString<T, V, O>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		blank: schema.blank,
		cast: true,
		clean(value, opts) {
			let res: any = value
			if (!(res === undefined || res === null || res === '')) {
				const date = new Date(res)
				if (isNaN(date.getTime())) {
					throw new ValidationError(
						getMessage(opts, 'invalid', 'Invalid value.'),
					)
				}
				if (schema.format === null) {
					// ok
				} else if (schema.format === 'iso') {
					res = date.toISOString()
				} else {
					res = date
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
