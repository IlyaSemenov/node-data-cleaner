import { getMessage } from '../utils'
import SchemaError from '../exceptions/SchemaError'
import ValidationError from '../exceptions/ValidationError'
import cleanAny, { AnySchema } from './any'
import { Cleaner, CleanerOptions } from '../types'

export interface ObjectSchema<T, E = any> extends AnySchema<T> {
	element?: Cleaner<E>,
	min?: number,
	max?: number
}

export default function cleanArray<T = Array<E> | null | undefined, E = any>(schema: ObjectSchema<T> = {}): Cleaner<T> {
	return cleanAny<T>({
		...schema as AnySchema<T>,
		async clean(value, opts = {}) {
			if (!(value === undefined || value === null)) {
				if (!Array.isArray(value)) {
					throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
				}
				if (schema.min && value.length < schema.min) {
					throw new ValidationError(getMessage(opts, 'array_min', "Not enough values."))
				}
				if (schema.max && value.length > schema.max) {
					throw new ValidationError(getMessage(opts, 'array_max', "Too many values."))
				}
				if (schema.element) {
					const cleanedArray = []
					const errors = []
					for (const el of value) {
						const cleanedEl = await Promise.resolve(schema.element(el, opts)).catch(err => {
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
						})
						cleanedArray.push(cleanedEl)
					}
					if (errors.length) {
						throw new ValidationError(errors)
					}
					value = cleanedArray
				}
			}

			if (schema.clean) {
				value = await Promise.resolve(schema.clean(value, opts))
			}

			return value
		}
	})
}
