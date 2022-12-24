import { SchemaError } from "../errors/SchemaError"
import { ValidationError } from "../errors/ValidationError"
import { getMessage, LimitTo } from "../utils"
import { AnySchema, cleanAny, setSchema } from "./any"

type TypeM<T> = LimitTo<T, string | null | undefined>

export type StringSchema<T, M extends TypeM<T> = TypeM<T>> = AnySchema<T, M> & {
	blank?: boolean | null
	cast?: boolean
	regexp?: RegExp
}

export function cleanString<T = string, M extends TypeM<T> = TypeM<T>>(
	schema: StringSchema<T, M> = {}
) {
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
	const cleaner = cleanAny<T>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		clean(value, context): T | Promise<T> {
			let res: M = value
			if (!(res === undefined || res === null)) {
				if (typeof res === "object" && schema.cast !== true) {
					throw new ValidationError(
						getMessage(context, "invalid", "Invalid value.")
					)
				}
				res = String(res) as M
				if (res === "") {
					if (schema.blank === null) {
						res = null as M
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
			return schema.clean ? schema.clean(res, context) : (res as unknown as T)
		},
	})
	return setSchema(cleaner, schema)
}
