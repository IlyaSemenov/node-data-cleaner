import { getMessage } from '../utils'
import { SchemaError } from '../errors/SchemaError'
import { ValidationError } from '../errors/ValidationError'
import { Cleaner } from '../types'

export interface AnySchema<T, V> {
	required?: boolean
	default?: any
	null?: boolean
	clean?: Cleaner<T, V>
}

export default function cleanAny<T = any, V = T>(
	schema: AnySchema<T, V> = {},
): Cleaner<T, V> {
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
	return async function(value, opts) {
		// TODO: make the function non async (need to update tests)
		let res: any = value
		if (res === undefined && schema.required !== false) {
			throw new ValidationError(getMessage(opts, 'required', 'Value required.'))
		}
		if (res === undefined && schema.default !== undefined) {
			res = schema.default
		}
		if (res === null && schema.null !== true) {
			throw new ValidationError(getMessage(opts, 'required', 'Value required.'))
		}
		if (schema.clean) {
			res = schema.clean(res, opts)
		}
		return res
	}
}
