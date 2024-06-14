import { ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"
import { AnyCleaner, AnySchema, cleanAny } from "./any"

export interface BooleanSchema extends AnySchema {
	/** No strict type check, convert value with `!!value` */
	cast?: boolean
	/** Return `undefined` for `false` */
	omit?: boolean
}

export function cleanBoolean<V = any, S extends BooleanSchema = BooleanSchema>(
	schema?: S
): AnyCleaner<boolean, V, S>

export function cleanBoolean(schema: BooleanSchema = {}) {
	return cleanAny(schema).clean((value, context) => {
		if (value === undefined) return undefined
		if (value === null) return null
		if (typeof value !== "boolean" && schema.cast !== true) {
			throw new ValidationError(
				getMessage(context, "invalid", "Invalid value.")
			)
		}
		const b = Boolean(value)
		if (b === false && schema.omit === true) {
			return undefined
		}
		return b
	})
}
