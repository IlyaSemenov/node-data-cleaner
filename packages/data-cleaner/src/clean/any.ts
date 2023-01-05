import { Cleaner } from "../cleaner"
import { SchemaError } from "../errors/SchemaError"
import { ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"

export interface AnySchema<T, V = any> {
	/** `required: false` - allow undefined values */
	required?: boolean
	/** `null: true` - allow null values */
	null?: boolean
	/** Replace `undefined` with this value (sets `required: false` automatically) */
	default?: any
	/** Override flat collector field label, or `null` to omit field label altogether. */
	label?: string | null
	/** Nested cleaner (called if the validation passes) */
	clean?: Cleaner<T, V>
}

export type WithSchema<C extends Cleaner<any>, S> = C & {
	schema: S
}

export function setSchema<C extends Cleaner<any>, S>(fn: C, schema: S) {
	;(fn as any).schema = schema
	return fn as WithSchema<C extends WithSchema<infer OC, any> ? OC : C, S>
}

export function cleanAny<T = any, V = any>(schema: AnySchema<T, V> = {}) {
	if (schema.default !== undefined) {
		if (schema.required === undefined) {
			schema.required = false
		} else if (schema.required !== false) {
			throw new SchemaError("clean.any with 'default' needs 'required: false'")
		}
	}
	if (schema.default === null) {
		if (schema.null === undefined) {
			schema.null = true
		} else if (schema.null !== true) {
			throw new SchemaError("clean.any with 'default: null' needs 'null: true'")
		}
	}
	const cleaner: Cleaner<T, V> = function (value, context) {
		if (value === undefined && schema.required !== false) {
			throw new ValidationError(
				getMessage(context, "required", "Value required.")
			)
		}
		if (value === undefined && schema.default !== undefined) {
			value = schema.default
		}
		if (value === null && schema.null !== true) {
			throw new ValidationError(
				getMessage(context, "required", "Value required.")
			)
		}
		return schema.clean ? schema.clean(value, context) : (value as unknown as T)
	}
	return setSchema(cleaner, schema)
}
