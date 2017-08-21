const { getMessage } = require("../utils")
const { SchemaError, ValidationError } = require("../exceptions")
const cleanAny = require("./any").default

exports.default = function(schema = {}) {
	if (typeof schema.fields !== "object") {
		throw new SchemaError("clean.object schema must include fields.")
	}
	const clean = cleanAny({
		...schema,
		async clean(value, opts = {}) {
			const errorGroups = []
			if (!(value === undefined || value === null)) {
				if (typeof value !== "object") {
					throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
				}
				const res = {}
				for (const field of Object.keys(schema.fields)) {
					const fieldValue = value.hasOwnProperty(field) ? value[field] : undefined
					const fieldCleaner = schema.fields[field]
					let cleanedFieldValue
					try {
						cleanedFieldValue = await Promise.resolve(fieldCleaner(fieldValue, {
							...opts,
							nested: true,
						}))
					} catch (err) {
						if (err instanceof ValidationError) {
							if (err.messages) {
								// plain errors -> {field: errors}
								errorGroups.push([field, err.messages])
							}
							if (err.errors) {
								// {subfield: errors}  -> {field.subfield: errors}
								for (const subfield of Object.keys(err.errors)) {
									errorGroups.push([field + "." + subfield, err.errors[subfield]])
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
				value = res
			}

			if (errorGroups.length) {
				// Combine field validation errors
				const errors = {}
				for (const [field, messages] of errorGroups) {
					if (!errors[field]) {
						errors[field] = []
					}
					errors[field] = errors[field].concat(messages)
				}
				throw new ValidationError(errors)
			}

			if (schema.clean) {
				value = await Promise.resolve(schema.clean(value, opts))
			}

			return value
		}
	})
	return async function(obj, opts={}) {
		if (!opts.nested) {
			// This is a top-level object
			// Collect plain errors into "opts.nonFieldErrorsKey"
			try {
				return await clean(obj, opts)
			} catch (err) {
				if (err instanceof ValidationError && err.messages) {
					throw new ValidationError({[schema.nonFieldErrorsKey || ""]: err.messages})
				} else {
					throw err
				}
			}
		} else {
			// This is a nested object
			// Don't do any conversion
			return await clean(obj, opts)
		}
	}
}
