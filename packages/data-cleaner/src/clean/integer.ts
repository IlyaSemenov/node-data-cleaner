import { setSchema } from "./any"
import { cleanNumber, NumberSchema } from "./number"

export type IntegerSchema<T> = Omit<NumberSchema<T>, "parseNumber">

export function cleanInteger<T = number, V = any>(
	schema: IntegerSchema<T> = {}
) {
	const cleaner = cleanNumber<T, V>({
		...schema,
		parseNumber: parseInt,
	})
	return setSchema(cleaner, schema)
}
