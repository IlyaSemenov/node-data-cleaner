import { SchemaError } from "../errors/SchemaError"
import { ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"
import { AnySchema, cleanAny, setSchema } from "./any"

export interface StringSchema<T> extends AnySchema<T, string> {
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

export function cleanString<T = string, V = any>(schema: StringSchema<T> = {}) {
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
	const cleaner = cleanAny<T, V>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		clean(value, context) {
			let res: any = value
			if (!(res === undefined || res === null)) {
				if (typeof res === "object" && schema.cast !== true) {
					throw new ValidationError(
						getMessage(context, "invalid", "Invalid value.")
					)
				}
				res = String(res)
				if (res === "") {
					if (schema.blank === null) {
						res = null
					} else if (schema.blank !== true) {
						throw new ValidationError(
							getMessage(context, "required", "Value required.")
						)
					}
				}
				if (res && schema.regexp && !schema.regexp.test(res as string)) {
					// Only test non-empty values
					throw new ValidationError(
						getMessage(context, "invalid", "Invalid value.")
					)
				}
			}
			return schema.clean ? schema.clean(res, context) : res
		},
	})
	return setSchema(cleaner, schema)
}
