import { SchemaError } from "../errors/SchemaError"
import { ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"
import { AnyCleaner, AnySchema, cleanAny } from "./any"

export interface StringSchema extends AnySchema {
	/**
	 * `blank: true` - allow blank values (empty strings).
	 *
	 * `blank: null` - convert blank values (empty strings) to `null` (sets `null: true` automatically).
	 */
	blank?: boolean | null
	/** `cast: true` - no strict type check, convert value with `String(value)` */
	cast?: boolean
	/** Test non-blank strings to match against regexp */
	regexp?: RegExp
}

export function cleanString<V = any, S extends StringSchema = StringSchema>(
	schema?: S
): AnyCleaner<string, V, S>

export function cleanString(schema: StringSchema = {}) {
	if (schema.blank === null) {
		if (schema.null === undefined) {
			schema.null = true
		} else if (schema.null !== true) {
			throw new SchemaError(
				"clean.string with 'blank: null' needs 'null: true'"
			)
		}
	}
	if (schema.regexp && typeof schema.regexp.test !== "function") {
		throw new SchemaError("clean.string regexp must be a RegExp object")
	}

	return cleanAny(schema).clean((value, context) => {
		if (value === undefined) return undefined
		if (value === null) return null
		if (typeof value === "object" && schema.cast !== true) {
			throw new ValidationError(
				getMessage(context, "invalid", "Invalid value.")
			)
		}
		const str = String(value)
		if (str === "") {
			if (schema.blank === null) {
				return null
			} else if (schema.blank !== true) {
				throw new ValidationError(
					getMessage(context, "required", "Value required.")
				)
			}
		}
		if (str && schema.regexp && !schema.regexp.test(str)) {
			// Only test non-empty values
			throw new ValidationError(
				getMessage(context, "invalid", "Invalid value.")
			)
		}
		return str
	})
}
