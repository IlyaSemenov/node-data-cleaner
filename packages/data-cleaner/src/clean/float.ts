import { AnyCleaner } from "./any"
import { cleanNumber, NumberSchema } from "./number"

export type FloatSchema = Omit<NumberSchema, "parseNumber">

export function cleanFloat<V = any, S extends FloatSchema = FloatSchema>(
	schema?: S
): AnyCleaner<number, V, S>

export function cleanFloat(schema: FloatSchema = {}) {
	return cleanNumber({
		...schema,
		parseNumber: parseFloat,
	})
}
