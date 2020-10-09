import { SchemaError } from '../errors/SchemaError'
import { ValidationError } from '../errors/ValidationError'
import { getMessage } from '../utils'
import { setSchema } from './any'
import { cleanString, StringSchema } from './string'

export interface DateSchema<T, V> extends StringSchema<T, V> {
	cast?: never
	regexp?: never
	format?: null | 'iso'
}

export function cleanDate<T = string, V = T>(schema: DateSchema<T, V> = {}) {
	if (
		!(
			schema.format === undefined ||
			schema.format === null ||
			schema.format === 'iso'
		)
	) {
		throw new SchemaError(
			"clean.date format may be only: undefined, null, 'iso'",
		)
	}
	// TODO: don't allow weird combinations e.g. { format: undefined, blank: true }
	const cleaner = cleanString<T, V>({
		...schema,
		cast: true, // TODO: double check this
		regexp: undefined,
		clean(value, context) {
			let res: any = value
			if (!(res === undefined || res === null || res === '')) {
				const date = new Date(res)
				if (isNaN(date.getTime())) {
					throw new ValidationError(
						getMessage(context, 'invalid', 'Invalid value.'),
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
				res = schema.clean(res, context)
			}
			return res
		},
	})
	return setSchema(cleaner, schema)
}
