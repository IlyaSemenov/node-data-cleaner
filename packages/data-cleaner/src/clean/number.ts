import { SchemaError } from "../errors/SchemaError"
import { ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"
import { AnySchema, cleanAny } from "./any"

export interface NumberSchema extends AnySchema {
	/** No strict type check, convert value with `parseInt(value)` */
	cast?: boolean
	/** Minimum allowed value */
	min?: number
	/** Maximum allowed value */
	max?: number
	parseNumber: (value: any) => number
}

export function cleanNumber<V = any>(schema: NumberSchema) {
	if (!schema.parseNumber) {
		throw new SchemaError("clean.number needs 'parseNumber'")
	}
	return cleanAny<V>(schema).clean((value, context) => {
		if (value === undefined) return undefined
		if (value === null) return null
		if (typeof value !== "number" && schema.cast !== true) {
			throw new ValidationError(
				getMessage(context, "invalid", "Invalid value.")
			)
		}
		if (value === "" && (schema.null === true || schema.default === null)) {
			return null
		}
		const num = schema.parseNumber(value)
		if (isNaN(num)) {
			throw new ValidationError(
				getMessage(context, "invalid", "Invalid value.")
			)
		}
		if (schema.min !== undefined && num < schema.min) {
			throw new ValidationError(
				getMessage(context, "invalid", "Value too low.")
			)
		}
		if (schema.max !== undefined && num > schema.max) {
			throw new ValidationError(
				getMessage(context, "invalid", "Value too high.")
			)
		}
		return num
	})
}
