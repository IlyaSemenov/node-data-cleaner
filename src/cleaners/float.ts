import cleanNumber, { NumberSchema } from './number'
import { CleanerOptions } from '../types'
import { setSchema } from './any'

export interface FloatSchema<T, V, O> extends NumberSchema<T, V, O> {}

export default function cleanFloat<
	T = number,
	V = T,
	O extends CleanerOptions = CleanerOptions
>(schema: FloatSchema<T, V, O> = {}) {
	const cleaner = cleanNumber<T, V, O>({
		...schema,
		parseNumber: parseFloat,
	})
	return setSchema(cleaner, schema)
}
