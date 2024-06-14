import { validate as validateEmail } from "email-validator"

import { ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"
import { AnyCleaner } from "./any"
import { cleanString, StringSchema } from "./string"

export type EmailSchema = StringSchema

export function cleanEmail<V = any, S extends EmailSchema = EmailSchema>(
	schema?: S
): AnyCleaner<string, V, S>

export function cleanEmail(schema: EmailSchema = {}) {
	return cleanString(schema).clean((value, context) => {
		if (value && !validateEmail(value)) {
			throw new ValidationError(
				getMessage(context, "invalid_email", "Invalid e-mail address.")
			)
		}
		return value
	})
}
