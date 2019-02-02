import { getMessage } from '../utils'
import { SchemaError } from '../errors/SchemaError'
import {
	ValidationError,
	FieldErrorMessages,
	ErrorMessages,
} from '../errors/ValidationError'
import { Cleaner, CleanerOptions } from '../types'
import cleanAny, { AnySchema, setSchema } from './any'

export type Dict = {
	[field: string]: any
}

export interface FieldCleanerOptions extends CleanerOptions {
	data: Object
}

export type ParseKeysOptions = boolean | ((key: string) => string[])

export interface ObjectSchema<T, V, O> extends AnySchema<T, V, O> {
	parseKeys?: ParseKeysOptions
	fields: {
		[fieldName: string]: Cleaner<any, any, FieldCleanerOptions>
	}
	nonFieldErrorsKey?: string
	groupErrors?: boolean
}

export default function cleanObject<
	T = Dict,
	V = T,
	O extends CleanerOptions = CleanerOptions
>(schema: ObjectSchema<T, V, O>) {
	if (!schema || typeof schema.fields !== 'object') {
		throw new SchemaError('clean.object schema must include fields.')
	}
	const schemaGroupErrors =
		schema.groupErrors !== undefined ? !!schema.groupErrors : true
	// TODO: prevent !groupErrors && nonFieldErrorsKey

	let cleaner: Cleaner<T, V, O> = cleanAny<T, V, O>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		async clean(value, opts) {
			let res: any = value
			const errors: string[] = [] // non-grouped errors
			const errorGroups: Array<[string, ErrorMessages]> = [] // grouped errors
			if (!(res === undefined || res === null)) {
				if (typeof res !== 'object') {
					throw new ValidationError(
						getMessage(opts, 'invalid', 'Invalid value.'),
					)
				}
				if (schema.parseKeys) {
					res = parseKeys(res, schema.parseKeys)
				}
				const cleanRes: Dict = {}
				const customDataStore = {}
				for (const field of Object.keys(schema.fields)) {
					const fieldValue = res.hasOwnProperty(field) ? res[field] : undefined
					const fieldCleaner = schema.fields[field]
					const fieldLabel =
						(fieldCleaner as any).schema && (fieldCleaner as any).schema.label
					let cleanedFieldValue
					try {
						cleanedFieldValue = await Promise.resolve(
							fieldCleaner(fieldValue, {
								// Prevent semantic error TS2698 Spread types may only be created from object types
								...(opts as object),
								data: customDataStore,
							}),
						)
					} catch (err) {
						if (err instanceof ValidationError) {
							if (err.messages) {
								// plain errors -> {field: errors}
								if (schemaGroupErrors) {
									errorGroups.push([field, err.messages])
								} else {
									let label = err.opts.label
									if (label === undefined) {
										label = fieldLabel
									}
									if (label === undefined) {
										label = makeLabelFromFieldName(field)
									}
									if (label) {
										errors.push(
											...err.messages.map(message => `${label}: ${message}`),
										)
									} else {
										errors.push(...err.messages)
									}
								}
							}
							if (err.errors) {
								// {subfield: errors}  -> {field.subfield: errors}
								if (schemaGroupErrors) {
									for (const subfield of Object.keys(err.errors)) {
										errorGroups.push([
											field + '.' + subfield,
											err.errors[subfield],
										])
									}
								} else {
									throw new Error(
										'Ungrouping grouped errors not supported. Convert nested cleaner to return ungrouped errors.',
									)
								}
							}
						} else {
							throw err
						}
					}
					if (cleanedFieldValue !== undefined) {
						cleanRes[field] = cleanedFieldValue
					}
				}
				Object.assign(cleanRes, customDataStore)
				res = cleanRes
			}

			if (errors.length) {
				throw new ValidationError(errors)
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
				res = schema.clean(res, opts)
			}
			return res
		},
	})

	const { nonFieldErrorsKey } = schema
	if (nonFieldErrorsKey !== undefined) {
		const wrapped_cleaner = cleaner
		cleaner = async function(value, opts) {
			try {
				return await wrapped_cleaner(value, opts)
			} catch (err) {
				if (err instanceof ValidationError && err.messages) {
					throw new ValidationError({ [nonFieldErrorsKey]: err.messages })
				} else {
					throw err
				}
			}
		}
	}

	return setSchema(cleaner, schema)
}

function parseKeys(obj: Dict, opts: ParseKeysOptions) {
	const getPathFromKey =
		typeof opts === 'function' ? opts : (key: string) => key.split('.')
	const res: Dict = {}
	for (const key of Object.keys(obj)) {
		const path = getPathFromKey(key)
		if (path) {
			setObjPath(res, path, obj[key])
		}
	}
	return res
}

function setObjPath(obj: Dict, path: string[], value: any): void {
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

function makeLabelFromFieldName(name: string) {
	// TODO: parse camelCase, snake_case
	return name[0].toUpperCase() + name.slice(1)
}
