import titleCase from 'title-case'
import { getMessage } from '../utils'
import { SchemaError } from '../errors/SchemaError'
import {
	ValidationError,
	FieldErrorMessages,
	ErrorMessages,
} from '../errors/ValidationError'
import { Cleaner } from '../types'
import cleanAny, { AnySchema, setSchema } from './any'

export type Dict = Record<string, any>

export type ParseKeysOptions = boolean | ((key: string) => string[])

export interface ObjectSchema<T, V> extends AnySchema<T, V> {
	parseKeys?: ParseKeysOptions
	fields: Record<string, Cleaner<any, any>>
	nonFieldErrorsKey?: string
	groupErrors?: boolean
}

export default function cleanObject<T = Dict, V = T>(
	schema: ObjectSchema<T, V>,
) {
	if (!schema || typeof schema.fields !== 'object') {
		throw new SchemaError('clean.object schema must include fields.')
	}
	const schemaGroupErrors =
		schema.groupErrors !== undefined ? !!schema.groupErrors : true
	// TODO: prevent !groupErrors && nonFieldErrorsKey

	let cleaner: Cleaner<T, V> = cleanAny<T, V>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		async clean(value, context = {}) {
			const groupErrors =
				context.groupErrors !== undefined
					? !!context.groupErrors
					: schemaGroupErrors
			let res: any = value
			const errors: string[] = [] // non-grouped errors
			const errorGroups: Array<[string, ErrorMessages]> = [] // grouped errors
			if (!(res === undefined || res === null)) {
				if (typeof res !== 'object') {
					throw new ValidationError(
						getMessage(context, 'invalid', 'Invalid value.'),
					)
				}
				if (schema.parseKeys) {
					res = parseKeys(res, schema.parseKeys)
				}
				const cleanRes: Dict = {}
				const customDataStore = {}
				const fieldCleanerContext = {
					...context,
					data: customDataStore,
					groupErrors: groupErrors === false ? groupErrors : undefined,
				}
				for (const field of Object.keys(schema.fields)) {
					const fieldValue = res.hasOwnProperty(field) ? res[field] : undefined
					const fieldCleaner = schema.fields[field]
					const fieldLabel =
						(fieldCleaner as any).schema && (fieldCleaner as any).schema.label
					let cleanedFieldValue
					try {
						cleanedFieldValue = await Promise.resolve(
							fieldCleaner(fieldValue, fieldCleanerContext),
						)
					} catch (err) {
						if (err instanceof ValidationError) {
							if (err.messages) {
								// plain errors -> {field: errors}
								if (groupErrors) {
									errorGroups.push([field, err.messages])
								} else {
									let label = err.opts.label
									if (label === undefined) {
										label = fieldLabel
									}
									if (label === undefined) {
										label = titleCase(field)
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
								if (groupErrors) {
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
				res = schema.clean(res, context)
			}
			return res
		},
	})

	const { nonFieldErrorsKey } = schema
	if (nonFieldErrorsKey !== undefined) {
		const wrapped_cleaner = cleaner
		cleaner = async function(value, context) {
			try {
				return await wrapped_cleaner(value, context)
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
