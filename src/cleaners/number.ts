import { getMessage } from '../utils'
import ValidationError from '../exceptions/ValidationError'
import SchemaError from '../exceptions/SchemaError'
import cleanAny, { AnySchema } from './any'
import { Cleaner } from '../types'

export interface GenericNumberSchema<T> extends AnySchema<T> {
	cast?: boolean
	min?: number
	max?: number
}

export interface NumberSchema<T> extends GenericNumberSchema<T> {
	parseNumber: Function
}

export default function cleanNumber<T>(schema: NumberSchema<T>): Cleaner<T> {
	if (schema.parseNumber === undefined) {
		throw new SchemaError("clean.number needs 'parseNumber'")
	}
	return cleanAny({
		...schema as AnySchema<T>,
		clean (value, opts) {
			if (!(value === undefined || value === null)) {
				if (typeof value !== "number" && schema.cast !== true) {
					throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
				}
				if (value === "" && (schema.null === true || schema.default === null)) {
					value = null
				} else {
					value = schema.parseNumber(value)
					if (isNaN(value)) {
						throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
					}
					if (schema.min !== undefined && value < schema.min) {
						throw new ValidationError(getMessage(opts, 'invalid', "Value too low."))
					}
					if (schema.max !== undefined && value > schema.max) {
						throw new ValidationError(getMessage(opts, 'invalid', "Value too high."))
					}
				}
			}
			if (schema.clean) {
				value = schema.clean(value, opts)
			}
			return value
		}
	})
}
