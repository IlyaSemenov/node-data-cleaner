import cleanNumber, { GenericNumberSchema } from './number'
import { Cleaner } from '../types'

export interface IntegerSchema<T> extends GenericNumberSchema<T> {}

export default function cleanInteger<T>(schema: IntegerSchema<T> = {}): Cleaner<T> {
	return cleanNumber({
		...schema,
		parseNumber: parseInt
	})
}
