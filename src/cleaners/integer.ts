import { cleanNumber, NumberSchema } from './number'
import { setSchema } from './any'

export interface IntegerSchema<T, V> extends NumberSchema<T, V> {}

export function cleanInteger<T = number, V = T>(
	schema: IntegerSchema<T, V> = {},
) {
	const cleaner = cleanNumber<T, V>({
		...schema,
		parseNumber: parseInt,
	})
	return setSchema(cleaner, schema)
}
