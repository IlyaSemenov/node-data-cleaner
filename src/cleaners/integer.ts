import cleanNumber, { NumberSchema } from './number'
import { Cleaner } from '../types'

export interface IntegerSchema<T, V> extends NumberSchema<T, V> {}

export default function cleanInteger<T = number, V = T>(
	schema: IntegerSchema<T, V> = {},
): Cleaner<T, V> {
	return cleanNumber<T, V>({
		...schema,
		parseNumber: parseInt,
	})
}
