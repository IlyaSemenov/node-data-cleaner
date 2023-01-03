import { SchemaError } from "../errors/SchemaError"
import { ValidationError } from "../errors/ValidationError"
import { getMessage, LimitTo } from "../utils"
import { setSchema } from "./any"
import { cleanString, StringSchema } from "./string"

type TypeM<T> = LimitTo<T, string | Date | null | undefined>

export interface DateSchema<T>
	extends Omit<StringSchema<T>, "cast" | "regexp"> {
	/**
	 * `format: undefined` (default) - return Date object
	 *
	 * `format: null` - return valid value as is
	 *
	 * `format: "iso"` - return ISO-formatted date
	 */
	format?: null | "iso"
}

export function cleanDate<T = string, M extends TypeM<T> = TypeM<T>>(
	schema: DateSchema<T> = {}
) {
	if (
		!(
			schema.format === undefined ||
			schema.format === null ||
			schema.format === "iso"
		)
	) {
		throw new SchemaError(
			"clean.date format may be only: undefined, null, 'iso'"
		)
	}
	// TODO: don't allow weird combinations e.g. { format: undefined, blank: true }
	const cleaner = cleanString<T>({
		...schema,
		cast: true, // TODO: double check this
		regexp: undefined,
		clean(value, context) {
			let res: M = value as M
			if (res) {
				const date = new Date(res as string)
				if (isNaN(date.getTime())) {
					throw new ValidationError(
						getMessage(context, "invalid", "Invalid value.")
					)
				}
				if (schema.format === null) {
					// ok
				} else if (schema.format === "iso") {
					res = date.toISOString() as M
				} else {
					res = date as M
				}
			}
			return schema.clean
				? schema.clean(res as any, context)
				: (res as unknown as T)
		},
	})
	return setSchema(cleaner, schema)
}
