import { SchemaError } from '../errors/SchemaError'
import { ValidationError } from '../errors/ValidationError'
import { getMessage, LimitTo } from '../utils'
import { AnySchema, setSchema } from './any'
import { cleanString, StringSchema } from './string'

export type TypeM<T> = LimitTo<T, string | Date | null | undefined>

export interface DateSchema<T, M extends TypeM<T> = TypeM<T>>
	extends Omit<StringSchema<T>, 'cast' | 'regexp' | 'clean'> {
	format?: null | 'iso'
	clean?: AnySchema<T, M>['clean']
}

export function cleanDate<T = string, M extends TypeM<T> = TypeM<T>>(
	schema: DateSchema<T, M> = {},
) {
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
	const cleaner = cleanString<T>({
		...schema,
		cast: true, // TODO: double check this
		regexp: undefined,
		clean(value, context) {
			let res: M = value as M
			if (res) {
				const date = new Date(res as string)
				if (isNaN(date.getTime())) {
					throw new ValidationError(
						getMessage(context, 'invalid', 'Invalid value.'),
					)
				}
				if (schema.format === null) {
					// ok
				} else if (schema.format === 'iso') {
					res = date.toISOString() as M
				} else {
					res = date as M
				}
			}
			return schema.clean ? schema.clean(res, context) : ((res as unknown) as T)
		},
	})
	return setSchema(cleaner, schema)
}
