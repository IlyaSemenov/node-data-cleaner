import { SchemaError } from '../errors/SchemaError'
import { setSchema } from './any'
import { cleanString, StringSchema } from './string'

export interface UuidSchema<T, V> extends StringSchema<T, V> {
	regexp: never
}

export function cleanUuid<T = string, V = T>(schema?: UuidSchema<T, V>) {
	const cleaner = cleanString({
		...schema,
		regexp: /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
	})
	return setSchema(cleaner, schema)
}
