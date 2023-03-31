import { capitalCase } from "capital-case"

import { Cleaner } from "../cleaner"
import { SchemaError } from "../errors/SchemaError"
import {
	ErrorMessages,
	ErrorOptions,
	FieldErrorMessages,
	ValidationError,
} from "../errors/ValidationError"
import { getMessage } from "../utils"
import { AnyCleaner, AnySchema, cleanAny } from "./any"

type Dict = Record<string, any>

type ParseKeysOptions = boolean | ((key: string) => string[])

type ObjectFields<M extends Dict> = {
	[F in keyof M]: Cleaner<M[F]>
}

type GetModelFromFields<F> = F extends ObjectFields<infer M> ? M : never

export interface ObjectSchema<M extends Dict> extends AnySchema {
	/** Create nested objects from keys like `job.position`
	 *
	 * `true`: split by dots
	 *
	 * `(string) => string[]`: custom key path parser function
	 */
	parseKeys?: ParseKeysOptions
	/** Field cleaners */
	fields: ObjectFields<M>
	/** Custom field labels (for flattened errors) */
	labels?: {
		[F in keyof M]?: string | null
	}
	/** `groupErrors: true` (default) - group field errors by field name */
	groupErrors?: boolean
}

export function cleanObject<
	V = any,
	S extends ObjectSchema<any> = ObjectSchema<any>
>(schema: S): AnyCleaner<GetModelFromFields<S["fields"]>, V, S>

export function cleanObject(schema: ObjectSchema<any>) {
	if (!schema || typeof schema.fields !== "object") {
		throw new SchemaError("clean.object schema must include fields.")
	}
	const schemaGroupErrors =
		schema.groupErrors !== undefined ? !!schema.groupErrors : true

	return cleanAny(schema).clean(async (value, context) => {
		if (value === undefined) return undefined
		if (value === null) return null

		const groupErrors =
			context?.groupErrors !== undefined
				? !!context.groupErrors
				: schemaGroupErrors

		const collectedErrors: Array<{
			field: string
			messages: ErrorMessages
			opts: ErrorOptions
		}> = []

		if (typeof value !== "object") {
			throw new ValidationError(
				getMessage(context, "invalid", "Invalid value.")
			)
		}

		const obj: Dict = schema.parseKeys
			? parseKeys(value, schema.parseKeys)
			: value
		const cleanRes: Dict = {}
		const customDataStore = {}
		const fieldCleanerContext = {
			...context,
			data: customDataStore,
			groupErrors: groupErrors === false ? groupErrors : undefined,
		}
		for (const [field, fieldCleaner] of Object.entries(schema.fields)) {
			const fieldValue = obj.hasOwnProperty(field) ? obj[field] : undefined
			let cleanedFieldValue
			try {
				cleanedFieldValue = await fieldCleaner(fieldValue, fieldCleanerContext)
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

		if (!collectedErrors.length) {
			return cleanRes
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
					label = schema.labels?.[field]
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
	})
}

/**
 * Convert object such as { "foo.bar": 1 } to { foo: { bar: 1} }
 */
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

/**
 * Set nested object key.
 *
 * @example setObjPath(obj, ['foo', 'bar'], 1) // obj.foo.bar = 1
 * */
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

export function cleanObjectFields<
	V = any,
	F extends ObjectFields<any> = ObjectFields<any>
>(fields: F): AnyCleaner<GetModelFromFields<F>, V> {
	return cleanObject<V>({ fields })
}
