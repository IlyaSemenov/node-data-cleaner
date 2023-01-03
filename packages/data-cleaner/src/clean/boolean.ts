import { ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"
import { AnySchema, cleanAny, setSchema } from "./any"

export interface BooleanSchema<T> extends AnySchema<T, boolean> {
	/** No strict type check, convert value with `!!value` */
	cast?: boolean
	/** Return `undefined` for `false` */
	omit?: boolean
}

export function cleanBoolean<T = boolean, V = any>(
	schema: BooleanSchema<T> = {}
) {
	const cleaner = cleanAny<T, V>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		clean(value, context) {
			let res: any = value
			if (!(res === undefined || res === null)) {
				if (typeof res !== "boolean" && schema.cast !== true) {
					throw new ValidationError(
						getMessage(context, "invalid", "Invalid value.")
					)
				}
				res = !!res
				if (res === false && schema.omit === true) {
					res = undefined
				}
			}
			return schema.clean ? schema.clean(res, context) : res
		},
	})
	return setSchema(cleaner, schema)
}
