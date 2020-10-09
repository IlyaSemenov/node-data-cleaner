import { setSchema } from './any'
import { cleanNumber, NumberSchema } from './number'

export interface FloatSchema<T, V> extends NumberSchema<T, V> {}

export function cleanFloat<T = number, V = T>(schema: FloatSchema<T, V> = {}) {
	const cleaner = cleanNumber<T, V>({
		...schema,
		parseNumber: parseFloat,
	})
	return setSchema(cleaner, schema)
}
