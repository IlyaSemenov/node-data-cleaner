import { setSchema } from "./any"
import { cleanNumber, NumberSchema } from "./number"

export type FloatSchema<T> = Omit<NumberSchema<T>, "parseNumber">

export function cleanFloat<T = number, V = any>(schema: FloatSchema<T> = {}) {
	const cleaner = cleanNumber<T, V>({
		...schema,
		parseNumber: parseFloat,
	})
	return setSchema(cleaner, schema)
}
