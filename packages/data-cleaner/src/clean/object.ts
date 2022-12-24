import { capitalCase } from "capital-case"

import { SchemaError } from "../errors/SchemaError"
import {
	ErrorMessages,
	ErrorOptions,
	FieldErrorMessages,
	ValidationError,
} from "../errors/ValidationError"
import { Cleaner } from "../types"
import { getMessage } from "../utils"
import { AnySchema, cleanAny, setSchema } from "./any"

type Dict = Record<string, any>

type ParseKeysOptions = boolean | ((key: string) => string[])

export type ObjectSchema<T, M> = AnySchema<T, M> & {
	parseKeys?: ParseKeysOptions
	fields: {
		[field in keyof M]?: Cleaner<M[field]>
	}
	nonFieldErrorsKey?: string
	groupErrors?: boolean
}

export function cleanObject<M extends Record<string, any>, T = M>(
	schema: ObjectSchema<T, M>
) {
	if (!schema || typeof schema.fields !== "object") {
		throw new SchemaError("clean.object schema must include fields.")
	}
	const schemaGroupErrors =
		schema.groupErrors !== undefined ? !!schema.groupErrors : true
	// TODO: prevent !groupErrors && nonFieldErrorsKey

	let cleaner: Cleaner<T> = cleanAny({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		async clean(value, context = {}) {
			const groupErrors =
				context.groupErrors !== undefined
					? !!context.groupErrors
					: schemaGroupErrors
			let res: any = value
			const collectedErrors: Array<{
				field: string
				messages: ErrorMessages
				opts: ErrorOptions
			}> = []
			if (!(res === undefined || res === null)) {
				if (typeof res !== "object") {
					throw new ValidationError(
						getMessage(context, "invalid", "Invalid value.")
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
				for (const [field, fieldCleaner] of Object.entries(schema.fields)) {
					const fieldValue = res.hasOwnProperty(field) ? res[field] : undefined
					let cleanedFieldValue
					try {
						cleanedFieldValue = await Promise.resolve(
							fieldCleaner(fieldValue, fieldCleanerContext)
						)
					} catch (err) {
						if (!(err instanceof ValidationError)) {
							throw err
						}
						if (err.messages) {
							// plain errors -> {field: errors}
							collectedErrors.push({
								field,
								messages: err.messages,
								opts: err.opts,
							})
						}
						if (err.errors) {
							if (!groupErrors) {
								throw new Error(
									"Error grouping disabled, but nested cleaner threw grouped ValidationError. Make sure nested cleaners only throw simple ValidationError's"
								)
							}
							for (const subfield of Object.keys(err.errors)) {
								// {subfield: errors}  -> {field.subfield: errors}
								collectedErrors.push({
									field: field + "." + subfield,
									messages: err.errors[subfield],
									opts: err.opts,
								})
							}
						}
					}
					if (cleanedFieldValue !== undefined) {
						cleanRes[field] = cleanedFieldValue
					}
				}
				Object.assign(cleanRes, customDataStore)
				res = cleanRes
			}

			if (!collectedErrors.length) {
				try {
					// Normal flow
					if (schema.clean) {
						res = await schema.clean(res, context)
					}
					return res
				} catch (err) {
					if (
						!(err instanceof ValidationError) ||
						err.messages ||
						groupErrors
					) {
						// Normal error handling
						throw err
					}
					// Error grouping disabled, but custom cleaner threw grouped errors
					// Pretend these were generated by fields, then they will be ungrouped below.
					if (err.errors) {
						for (const field of Object.keys(err.errors)) {
							collectedErrors.push({
								field,
								messages: err.errors[field],
								opts: err.opts,
							})
						}
					}
				}
			}

			if (groupErrors) {
				const errors: FieldErrorMessages = {}
				for (const { field, messages } of collectedErrors) {
					if (!errors[field]) {
						errors[field] = []
					}
					errors[field].push(...messages)
				}
				throw new ValidationError(errors)
			} else {
				const allMessages: ErrorMessages = []
				for (const { field, messages, opts } of collectedErrors) {
					let label = opts.label
					if (label === undefined) {
						const fieldCleaner: any = schema.fields[field]
						label =
							fieldCleaner && fieldCleaner.schema && fieldCleaner.schema.label
					}
					if (label === undefined) {
						label = capitalCase(field)
					}
					allMessages.push(
						...(label
							? messages.map((message) => `${label}: ${message}`)
							: messages)
					)
				}
				throw new ValidationError(allMessages)
			}
		},
	})

	const { nonFieldErrorsKey } = schema
	if (nonFieldErrorsKey !== undefined) {
		const wrapped_cleaner = cleaner
		cleaner = async function (value, context) {
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
		typeof opts === "function" ? opts : (key: string) => key.split(".")
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

cleanObject.fields = function <T extends Record<string, any>>(
	fields: ObjectSchema<T, T>["fields"]
) {
	return cleanObject<T, T>({ fields })
}
