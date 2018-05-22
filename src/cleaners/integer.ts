import cleanNumber, { NumberSchema } from './number'
import { Cleaner } from '../types'

export interface IntegerSchema<T> extends NumberSchema<T> {}

export default function cleanInteger<T = number | null | undefined>(schema: IntegerSchema<T> = {}): Cleaner<T> {
	return cleanNumber<T>({
		...schema,
		parseNumber: parseInt
	})
}
