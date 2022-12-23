import { SchemaError } from "../errors/SchemaError"
import { ValidationError } from "../errors/ValidationError"
import { Cleaner } from "../types"
import { getMessage } from "../utils"

export type AnySchema<T, M> = {
	required?: boolean
	default?: any
	null?: boolean
	label?: string | null
	clean?: Cleaner<T, M>
}

/* This breaks reverse type inference in many cases:

& ([M] extends [T]
	? {
			clean?: Cleaner<T, M>
	  }
	: {
			clean: Cleaner<T, M>
		})
*/

type WithSchema<C extends Cleaner<any>, S> = C & {
	schema: S
}

export function setSchema<C extends Cleaner<any>, S>(fn: C, schema: S) {
	;(fn as any).schema = schema
	return fn as WithSchema<C extends WithSchema<infer OC, any> ? OC : C, S>
}

export function cleanAny<T = any, M = any>(
	schema: AnySchema<T, M> = {} as AnySchema<T, M>
) {
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
	const cleaner: Cleaner<T> = function (value, context) {
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
