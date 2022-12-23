import { setSchema } from "./any"
import { cleanNumber, NumberSchema } from "./number"

export type FloatSchema<T> = Omit<NumberSchema<T>, "parseNumber">

export function cleanFloat<T = number>(schema: FloatSchema<T> = {}) {
	const cleaner = cleanNumber<T>({
		...schema,
		parseNumber: parseFloat,
	})
	return setSchema(cleaner, schema)
}
