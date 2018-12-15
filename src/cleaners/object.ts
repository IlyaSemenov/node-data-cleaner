import { getMessage } from '../utils'
import { SchemaError } from '../errors/SchemaError'
import {
	ValidationError,
	FieldErrorMessages,
	ErrorMessages,
} from '../errors/ValidationError'
import cleanAny, { AnySchema } from './any'
import { Cleaner, CleanerOptions } from '../types'

export type DirtyObject = { [field: string]: any }

export type CleanObject = { [field: string]: any }

export interface FieldCleanerOptions extends CleanerOptions {
	data: Object
}

export type FieldCleaner<T = any> = (
	value: any,
	opts: FieldCleanerOptions,
) => T | Promise<T>

export type ParseKeysOptions = true | ((key: string) => string[])

export interface ObjectSchema<
	T,
	fields = {
		[fieldName: string]: FieldCleaner
	}
> extends AnySchema<T> {
	parseKeys?: ParseKeysOptions
	fields: fields
	nonFieldErrorsKey?: string
}

export default function cleanObject<T = any>(
	schema: ObjectSchema<T>,
): Cleaner<T> {
	if (!schema || typeof schema.fields !== 'object') {
		throw new SchemaError('clean.object schema must include fields.')
	}
	const cleaner = cleanAny({
		...(schema as AnySchema<T>),
		async clean(value, opts = {}) {
			const errorGroups: Array<[string, ErrorMessages]> = []
			if (!(value === undefined || value === null)) {
				if (typeof value !== 'object') {
					throw new ValidationError(
						getMessage(opts, 'invalid', 'Invalid value.'),
					)
				}
				if (schema.parseKeys) {
					value = parseKeys(value, schema.parseKeys)
				}
				const res: CleanObject = {}
				const customDataStore = {}
				for (const field of Object.keys(schema.fields)) {
					const fieldValue = value.hasOwnProperty(field)
						? value[field]
						: undefined
					const fieldCleaner = schema.fields[field]
					let cleanedFieldValue
					try {
						cleanedFieldValue = await Promise.resolve(
							fieldCleaner(fieldValue, {
								...opts,
								data: customDataStore,
							}),
						)
					} catch (err) {
						if (err instanceof ValidationError) {
							if (err.messages) {
								// plain errors -> {field: errors}
								errorGroups.push([field, err.messages])
							}
							if (err.errors) {
								// {subfield: errors}  -> {field.subfield: errors}
								for (const subfield of Object.keys(err.errors)) {
									errorGroups.push([
										field + '.' + subfield,
										err.errors[subfield],
									])
								}
							}
						} else {
							throw err
						}
					}
					if (cleanedFieldValue !== undefined) {
						res[field] = cleanedFieldValue
					}
				}
				Object.assign(res, customDataStore)
				value = res
			}

			if (errorGroups.length) {
				// Combine field validation errors
				const errors: FieldErrorMessages = {}
				for (const [field, messages] of errorGroups) {
					if (!errors[field]) {
						errors[field] = []
					}
					errors[field] = errors[field].concat(messages)
				}
				throw new ValidationError(errors)
			}

			if (schema.clean) {
				value = schema.clean(value, opts)
			}
			return value
		},
	})

	const { nonFieldErrorsKey } = schema
	if (nonFieldErrorsKey !== undefined) {
		return async function(value, opts) {
			try {
				return await cleaner(value, opts)
			} catch (err) {
				if (err instanceof ValidationError && err.messages) {
					throw new ValidationError({ [nonFieldErrorsKey]: err.messages })
				} else {
					throw err
				}
			}
		}
	} else {
		return cleaner
	}
}

function parseKeys(obj: DirtyObject, opts: ParseKeysOptions) {
	const getPathFromKey =
		typeof opts === 'function' ? opts : (key: string) => key.split('.')
	const res: DirtyObject = {}
	for (const key of Object.keys(obj)) {
		const path = getPathFromKey(key)
		if (path) {
			setObjPath(res, path, obj[key])
		}
	}
	return res
}

function setObjPath(obj: DirtyObject, path: string[], value: any): void {
	for (let i = 0; i < path.length; ++i) {
		const key = path[i]
		if (i < path.length - 1) {
			if (obj[key] === undefined) {
				obj[key] = {}
			}
			obj = obj[key]
		} else {
			obj[key] = value
		}
	}
}
