import cleanNumber, { NumberSchema } from './number'
import { Cleaner } from '../types'

export interface FloatSchema<T> extends NumberSchema<T> {}

export default function cleanFloat<T = number | null | undefined>(schema: FloatSchema<T> = {}): Cleaner<T> {
	return cleanNumber<T>({
		...schema,
		parseNumber: parseFloat
	})
}
