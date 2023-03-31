import { AnyCleaner } from "./any"
import { cleanString, StringSchema } from "./string"

export type UuidSchema = Omit<StringSchema, "regexp">

export function cleanUuid<V = any, S extends UuidSchema = UuidSchema>(
	schema?: S
): AnyCleaner<string, V, S>

export function cleanUuid(schema: UuidSchema = {}) {
	return cleanString({
		...schema,
		regexp: /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
	})
}
