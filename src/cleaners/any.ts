import { getMessage } from '../utils'
import { SchemaError } from '../errors/SchemaError'
import { ValidationError } from '../errors/ValidationError'
import { Cleaner } from '../types'

export interface AnySchema<T> {
	required?: boolean
	default?: any
	null?: boolean
	clean?: Cleaner<T>
}

export default function cleanAny<T = any>(schema: AnySchema<T> = {}): Cleaner<T> {
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
	// TODO: return non-async function (all tests must be fixed).
	return async function(value, opts) {
		if (value === undefined && schema.required !== false) {
			throw new ValidationError(getMessage(opts, 'required', "Value required."))
		}
		if (value === undefined && schema.default !== undefined) {
			value = schema.default
		}
		if (value === null && schema.null !== true) {
			throw new ValidationError(getMessage(opts, 'required', "Value required."))
		}
		if (schema.clean) {
			value = schema.clean(value, opts)
		}
		return value
	}
}
