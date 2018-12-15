import cleanString, { StringSchema } from './string'
import { SchemaError } from '../errors/SchemaError'
import { ValidationError } from '../errors/ValidationError'
import { Cleaner } from '../types'
import { getMessage } from '../utils'

export interface DateSchema<T> extends StringSchema<T> {
	cast?: never
	format?: null | 'iso'
}

export default function cleanDate<T = string>(schema: DateSchema<T> = {}): Cleaner<T> {
	if (!(schema.format === undefined || schema.format === null || schema.format === 'iso')) {
		throw new SchemaError("clean.date result may be only: undefined, null, 'iso'")
	}
	// TODO: don't allow weird combinations e.g. { format: undefined, blank: true }
	return cleanString<T>({
		...schema as StringSchema<T>,
		cast: true,
		clean (value, opts) {
			if (value === null || value === undefined || value === '') {
				return value
			}
			const date = new Date(value)
			if (isNaN(date.getTime())) {
				throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
			}
			let result
			if (schema.format === null) {
				result = value
			} else if (schema.format === 'iso') {
				result = date.toISOString()
			} else {
				result = date
			}
			if (schema.clean) {
				result = schema.clean(result, opts)
			}
			return result
		}
	})
}
