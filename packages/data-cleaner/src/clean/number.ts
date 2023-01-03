import { SchemaError } from "../errors/SchemaError"
import { ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"
import { AnySchema, cleanAny, setSchema } from "./any"

export interface NumberSchema<T> extends AnySchema<T, number> {
	/** No strict type check, convert value with `parseInt(value)` */
	cast?: boolean
	/** Minimum allowed value */
	min?: number
	/** Maximum allowed value */
	max?: number
	parseNumber: (value: any) => number
}

export function cleanNumber<T = number, V = any>(schema: NumberSchema<T>) {
	if (!schema.parseNumber) {
		throw new SchemaError("clean.number needs 'parseNumber'")
	}
	const cleaner = cleanAny<T, V>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		clean(value, context) {
			let res: any = value
			if (!(res === undefined || res === null)) {
				if (typeof res !== "number" && schema.cast !== true) {
					throw new ValidationError(
						getMessage(context, "invalid", "Invalid value.")
					)
				}
				if (res === "" && (schema.null === true || schema.default === null)) {
					res = null
				} else {
					res = schema.parseNumber(res)
					if (isNaN(res)) {
						throw new ValidationError(
							getMessage(context, "invalid", "Invalid value.")
						)
					}
					if (schema.min !== undefined && res < schema.min) {
						throw new ValidationError(
							getMessage(context, "invalid", "Value too low.")
						)
					}
					if (schema.max !== undefined && res > schema.max) {
						throw new ValidationError(
							getMessage(context, "invalid", "Value too high.")
						)
					}
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
