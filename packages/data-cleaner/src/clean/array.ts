import { ErrorMessages, ValidationError } from "../errors/ValidationError"
import { Cleaner } from "../types"
import { getMessage, LimitTo } from "../utils"
import { AnySchema, cleanAny, setSchema } from "./any"

export type TypeM<T, E> = LimitTo<T, E[] | null | undefined>

export interface ArraySchema<T, E, M extends TypeM<T, E> = TypeM<T, E>>
	extends AnySchema<T, M> {
	element?: Cleaner<E>
	min?: number
	max?: number
}

export function cleanArray<
	E = any,
	T = E[],
	M extends TypeM<T, E> = TypeM<T, E>
>(schema: ArraySchema<T, E, M> = {}) {
	const cleaner = cleanAny<T>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		async clean(value, context) {
			let res: M = value
			if (!(res === undefined || res === null)) {
				if (!Array.isArray(res)) {
					throw new ValidationError(
						getMessage(context, "invalid", "Invalid value.")
					)
				}
				if (schema.min && res.length < schema.min) {
					throw new ValidationError(
						getMessage(context, "array_min", "Not enough values.")
					)
				}
				if (schema.max && res.length > schema.max) {
					throw new ValidationError(
						getMessage(context, "array_max", "Too many values.")
					)
				}
				if (schema.element) {
					const cleanedArray: E[] = []
					const errors: ErrorMessages = []
					// TODO: use Promise.all instead of loop
					for (const el of res) {
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
					res = cleanedArray as M
				}
			}
			return schema.clean ? schema.clean(res, context) : (res as unknown as T)
		},
	})
	return setSchema(cleaner, schema)
}
