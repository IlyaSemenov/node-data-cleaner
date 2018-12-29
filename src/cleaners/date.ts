import cleanString, { StringSchema } from './string'
import { SchemaError } from '../errors/SchemaError'
import { ValidationError } from '../errors/ValidationError'
import { Cleaner } from '../types'
import { getMessage } from '../utils'

export interface DateSchema<T, V> extends StringSchema<T, V> {
	cast?: never
	format?: null | 'iso'
}

export default function cleanDate<T = string, V = T>(
	schema: DateSchema<T, V> = {},
): Cleaner<T, V> {
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
	return cleanString<T, V>({
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
}
