import { Cleaner } from "../cleaner"
import { ErrorMessages, ValidationError } from "../errors/ValidationError"
import { getMessage } from "../utils"
import { AnyCleaner, AnySchema, cleanAny } from "./any"

export interface ArraySchema<E> extends AnySchema {
	/** Individual element cleaner. */
	element?: Cleaner<E>
	/** Minimum allowed number of elements. */
	min?: number
	/** Maximum allowed number of elements. */
	max?: number
}

export function cleanArray<
	V = any,
	S extends ArraySchema<any> = ArraySchema<any>
>(
	schema?: S
): AnyCleaner<S["element"] extends Cleaner<infer E> ? E[] : any[], V, S>

export function cleanArray(schema: ArraySchema<any> = {}) {
	return cleanAny(schema).clean(async (value, context) => {
		if (value === undefined) return undefined
		if (value === null) return null
		if (!Array.isArray(value)) {
			throw new ValidationError(
				getMessage(context, "invalid", "Invalid value.")
			)
		}
		if (schema.min !== undefined && value.length < schema.min) {
			throw new ValidationError(
				getMessage(context, "array_min", "Not enough values.")
			)
		}
		if (schema.max !== undefined && value.length > schema.max) {
			throw new ValidationError(
				getMessage(context, "array_max", "Too many values.")
			)
		}
		if (schema.element) {
			const cleanedArray: any[] = []
			const errors: ErrorMessages = []
			// TODO: use Promise.all instead of loop
			for (const el of value) {
				try {
					cleanedArray.push(await schema.element(el, context))
				} catch (err) {
					if (err instanceof ValidationError) {
						if (err.messages) {
							errors.push(...err.messages)
						}
						if (err.errors) {
							for (const subfield of Object.keys(err.errors)) {
								errors.push(`${subfield}: ${err.errors[subfield]}`)
								// TODO: define object error decomposition method via schema options.
							}
						}
					} else {
						throw err
					}
				}
			}
			if (errors.length) {
				throw new ValidationError(errors)
			}
			return cleanedArray
		} else {
			return value
		}
	})
}
