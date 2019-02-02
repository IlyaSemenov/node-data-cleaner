import { getMessage } from '../utils'
import { ValidationError } from '../errors/ValidationError'
import { SchemaError } from '../errors/SchemaError'
import cleanAny, { AnySchema, setSchema } from './any'
import { CleanerOptions } from '../types'

export interface NumberSchema<T, V, O> extends AnySchema<T, V, O> {
	cast?: boolean
	min?: number
	max?: number
}

export interface NumberParserSchema<T, V, O> extends NumberSchema<T, V, O> {
	parseNumber: (value: any) => number
}

export default function cleanNumber<
	T = number,
	V = T,
	O extends CleanerOptions = CleanerOptions
>(schema: NumberParserSchema<T, V, O>) {
	if (schema.parseNumber === undefined) {
		throw new SchemaError("clean.number needs 'parseNumber'")
	}
	const cleaner = cleanAny<T, V, O>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		clean(value, opts) {
			let res: any = value
			if (!(res === undefined || res === null)) {
				if (typeof res !== 'number' && schema.cast !== true) {
					throw new ValidationError(
						getMessage(opts, 'invalid', 'Invalid value.'),
					)
				}
				if (res === '' && (schema.null === true || schema.default === null)) {
					res = null
				} else {
					res = schema.parseNumber(res)
					if (isNaN(res)) {
						throw new ValidationError(
							getMessage(opts, 'invalid', 'Invalid value.'),
						)
					}
					if (schema.min !== undefined && res < schema.min) {
						throw new ValidationError(
							getMessage(opts, 'invalid', 'Value too low.'),
						)
					}
					if (schema.max !== undefined && res > schema.max) {
						throw new ValidationError(
							getMessage(opts, 'invalid', 'Value too high.'),
						)
					}
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
