import { ChainableCleaner, cleaner } from "../chainable"
import { SchemaError } from "../errors/SchemaError"
import { ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"

export interface AnySchema {
	/** `required: false` - allow undefined values */
	required?: boolean
	/** `null: true` - allow null values */
	null?: boolean
	/** Replace `undefined` with this value (sets `required: false` automatically) */
	default?: any
	/** @deprecated clean as a schema field is deprecated - use chainable clean */
	clean?: never
}

/** Optionally widen T with undefined based on schema. */
type ApplyRequired<T, S extends AnySchema> = S extends { required: false }
	? T | undefined
	: T

/** Optionally widen T with null based on schema. */
type ApplyNull<T, S extends AnySchema> = S extends { null: true } ? T | null : T

/** Optionally widen T with undefined and null based on schema. */
type ApplyAnySchema<T, S extends AnySchema> = ApplyRequired<ApplyNull<T, S>, S>

/** A chainable cleaner from V to S that follows AnySchema contract in S when widening T with undefined and null. */
export type AnyCleaner<
	T,
	V,
	S extends AnySchema = Record<string, never>
> = ChainableCleaner<ApplyAnySchema<T, S>, V>

export function cleanAny<V = any, S extends AnySchema = AnySchema>(
	schema?: S
): AnyCleaner<V, V, S>

/**
 * Base chainable cleaner that handles undefined, null and default values.
 *
 * Stores schema into function property.
 */
export function cleanAny(schema: AnySchema = {}) {
	if (schema.clean) {
		throw new SchemaError(
			"clean as a schema field is not supported anymore - use chainable clean"
		)
	}
	// TODO: destructure schema instead of modifying it in-place
	if (schema.default !== undefined) {
		if (schema.required === undefined) {
			schema.required = false
		} else if (schema.required !== false) {
			throw new SchemaError("cleanAny with 'default' needs 'required: false'")
		}
	}
	if (schema.default === null) {
		if (schema.null === undefined) {
			schema.null = true
		} else if (schema.null !== true) {
			throw new SchemaError("cleanAny with 'default: null' needs 'null: true'")
		}
	}

	return cleaner((value, context) => {
		if (value === undefined) {
			if (schema.required !== false) {
				throw new ValidationError(
					getMessage(context, "required", "Value required.")
				)
			}
			return schema.default
		}
		if (value === null) {
			if (schema.null !== true) {
				throw new ValidationError(
					getMessage(context, "required", "Value required.")
				)
			}
			return null
		}
		return value
	})
}
