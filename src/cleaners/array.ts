import { getMessage } from '../utils'
import { ValidationError, ErrorMessages } from '../errors/ValidationError'
import cleanAny, { AnySchema } from './any'
import { Cleaner, CleanerOptions } from '../types'

export interface ArraySchema<E, T, V> extends AnySchema<T, V> {
	element?: Cleaner<E>
	min?: number
	max?: number
}

export default function cleanArray<E = any, T = E[], V = T>(
	schema: ArraySchema<E, T, V> = {},
): Cleaner<T, V> {
	return cleanAny<T, V>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		async clean(value, opts: CleanerOptions = {}) {
			let res: any = value
			if (!(res === undefined || res === null)) {
				if (!Array.isArray(res)) {
					throw new ValidationError(
						getMessage(opts, 'invalid', 'Invalid value.'),
					)
				}
				if (schema.min && res.length < schema.min) {
					throw new ValidationError(
						getMessage(opts, 'array_min', 'Not enough values.'),
					)
				}
				if (schema.max && res.length > schema.max) {
					throw new ValidationError(
						getMessage(opts, 'array_max', 'Too many values.'),
					)
				}
				if (schema.element) {
					const cleanedArray = []
					const errors: ErrorMessages = []
					// TODO: use Promise.all instead of loop
					for (const el of res) {
						try {
							cleanedArray.push(await schema.element(el, opts))
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
					res = cleanedArray
				}
			}

			if (schema.clean) {
				res = schema.clean(res, opts)
			}
			return res
		},
	})
}
