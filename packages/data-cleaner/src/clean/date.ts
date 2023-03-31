import { SchemaError } from "../errors/SchemaError"
import { ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"
import { AnyCleaner } from "./any"
import { cleanString, StringSchema } from "./string"

export interface DateSchema extends Omit<StringSchema, "cast" | "regexp"> {
	/**
	 * `format: undefined` (default) - return Date object
	 *
	 * `format: null` - return valid value as is
	 *
	 * `format: "iso"` - return ISO-formatted date-time
	 */
	format?: null | "iso"
}

export function cleanDate<V = any, S extends DateSchema = DateSchema>(
	schema?: S
): AnyCleaner<S extends { format: null | "iso" } ? string : Date, V, S>

export function cleanDate(schema: DateSchema = {}) {
	if (
		!(
			schema.format === undefined ||
			schema.format === null ||
			schema.format === "iso"
		)
	) {
		throw new SchemaError(
			"clean.date format may be one of: undefined, null, 'iso'"
		)
	}
	if (schema.format !== null && schema.blank === true) {
		throw new SchemaError(
			"clean.date can't accept blank: true if format is not null"
		)
	}
	// TODO: don't allow weird combinations e.g. { format: undefined, blank: true }
	return cleanString({
		...schema,
		cast: true, // TODO: double check this
		regexp: undefined,
	}).clean((value, context) => {
		if (value === undefined) return undefined
		if (value === null) return null
		if (value === "" && schema.format === null) {
			return ""
		}
		const date = new Date(value)
		if (isNaN(date.getTime())) {
			throw new ValidationError(
				getMessage(context, "invalid", "Invalid value.")
			)
		}
		if (schema.format === null) {
			return value
		} else if (schema.format === "iso") {
			return date.toISOString()
		} else {
			// default: return Date object
			return date
		}
	})
}
