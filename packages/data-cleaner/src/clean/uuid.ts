import { setSchema } from "./any"
import { cleanString, StringSchema } from "./string"

export type UuidSchema<T> = Omit<StringSchema<T>, "regexp">

export function cleanUuid<T = string>(schema: UuidSchema<T> = {}) {
	const cleaner = cleanString<T>({
		...schema,
		regexp: /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
	})
	return setSchema(cleaner, schema)
}
