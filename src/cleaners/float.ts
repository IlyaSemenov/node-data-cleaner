import cleanNumber, { NumberSchema } from './number'
import { Cleaner } from '../types'

export interface FloatSchema<T, V> extends NumberSchema<T, V> {}

export default function cleanFloat<T = number, V = T>(
	schema: FloatSchema<T, V> = {},
): Cleaner<T, V> {
	return cleanNumber<T, V>({
		...schema,
		parseNumber: parseFloat,
	})
}
