import { SchemaError } from '../errors/SchemaError'
import { ValidationError } from '../errors/ValidationError'
import { Cleaner } from '../types'
import { getMessage } from '../utils'

export interface AnySchema<T, V> {
	required?: boolean
	default?: any
	null?: boolean
	clean?: Cleaner<T, V>
	label?: string | null
}

export type WithSchema<C> = C & {
	schema: any
}

export function setSchema<C extends Cleaner<any, any>>(fn: C, schema: any) {
	;(fn as any).schema = schema
	return fn as WithSchema<C>
}

export function cleanAny<T = any, V = T>(schema: AnySchema<T, V> = {}) {
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
	const cleaner: Cleaner<T, V> = function(value, context) {
		let res: any = value
		if (res === undefined && schema.required !== false) {
			throw new ValidationError(
				getMessage(context, 'required', 'Value required.'),
			)
		}
		if (res === undefined && schema.default !== undefined) {
			res = schema.default
		}
		if (res === null && schema.null !== true) {
			throw new ValidationError(
				getMessage(context, 'required', 'Value required.'),
			)
		}
		if (schema.clean) {
			res = schema.clean(res, context)
		}
		return res
	}
	return setSchema(cleaner, schema)
}
