import cleanNumber, { NumberSchema } from './number'
import { CleanerOptions } from '../types'
import { setSchema } from './any'

export interface IntegerSchema<T, V, O> extends NumberSchema<T, V, O> {}

export default function cleanInteger<
	T = number,
	V = T,
	O extends CleanerOptions = CleanerOptions
>(schema: IntegerSchema<T, V, O> = {}) {
	const cleaner = cleanNumber<T, V, O>({
		...schema,
		parseNumber: parseInt,
	})
	return setSchema(cleaner, schema)
}
