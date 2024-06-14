import { AnyCleaner } from "./any"
import { cleanNumber, NumberSchema } from "./number"

export type IntegerSchema = Omit<NumberSchema, "parseNumber">

export function cleanInteger<V = any, S extends IntegerSchema = IntegerSchema>(
	schema?: S
): AnyCleaner<number, V, S>

export function cleanInteger(schema: IntegerSchema = {}) {
	return cleanNumber({
		...schema,
		parseNumber: parseInt,
	})
}
