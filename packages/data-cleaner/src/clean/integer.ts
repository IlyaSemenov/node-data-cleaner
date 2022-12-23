import { setSchema } from "./any"
import { cleanNumber, NumberSchema } from "./number"

export type IntegerSchema<T> = Omit<NumberSchema<T>, "parseNumber">

export function cleanInteger<T = number>(schema: IntegerSchema<T> = {}) {
	const cleaner = cleanNumber<T>({
		...schema,
		parseNumber: parseInt,
	})
	return setSchema(cleaner, schema)
}
