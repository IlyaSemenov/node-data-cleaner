import { validate as validateEmail } from "email-validator"

import { ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"
import { setSchema } from "./any"
import { cleanString, StringSchema } from "./string"

export type EmailSchema<T> = StringSchema<T>

export function cleanEmail<T = string, V = any>(schema: EmailSchema<T> = {}) {
	const cleaner = cleanString<T, V>({
		...schema,
		cast: true, // why?
		clean(value, context) {
			if (value && !validateEmail(value as string)) {
				throw new ValidationError(
					getMessage(context, "invalid_email", "Invalid e-mail address.")
				)
			}
			const res: any = value
			return schema.clean ? schema.clean(res, context) : res
		},
	})
	return setSchema(cleaner, schema)
}
