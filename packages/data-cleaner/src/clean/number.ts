import { SchemaError } from "../errors/SchemaError"
import { ValidationError } from "../errors/ValidationError"
import { getMessage, LimitTo } from "../utils"
import { AnySchema, cleanAny, setSchema } from "./any"

export type TypeM<T> = LimitTo<T, number | null | undefined>

export type NumberSchema<T, M extends TypeM<T> = TypeM<T>> = AnySchema<T, M> & {
	cast?: boolean
	min?: number
	max?: number
	parseNumber: (value: any) => number
}

export function cleanNumber<T = number, M extends TypeM<T> = TypeM<T>>(
	schema: NumberSchema<T, M>
) {
	if (!schema.parseNumber) {
		throw new SchemaError("clean.number needs 'parseNumber'")
	}
	const cleaner = cleanAny<T>({
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
