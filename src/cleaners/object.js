const { getMessage } = require("../utils")
const { SchemaError, ValidationError } = require("../exceptions")
const cleanAny = require("./any").default

async function guardFieldClean(errors, field, boundCleaner) {
	try {
		return await Promise.resolve(boundCleaner())
	} catch (err) {
		if (err instanceof ValidationError) {
			if (err.errors) {
				errors.push(err.errors)
			}
			if (err.messages) {
				errors.push({[field]: err.messages})
			}
		} else {
			throw err
		}
	}
}

exports.default = function(schema = {}) {
	if (typeof schema.fields !== "object") {
		throw new SchemaError("clean.object schema must include fields.")
	}
	return cleanAny({
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
					const fullField = opts.field ? (opts.field + "." + field) : field
					const cleanedFieldValue = await guardFieldClean(errorGroups, fullField, () => {
						return fieldCleaner(fieldValue, {
							...opts,
							field: fullField,
						})
					})
					if (cleanedFieldValue !== undefined) {
						res[field] = cleanedFieldValue
					}
				}
				value = res
			}

			// Call custom clean (unless there were field validation errors)
			if (schema.clean && !errorGroups.length) {
				const cleaner = () => {
					return schema.clean(value, opts)
				}
				if (opts.field) {
					// nested object - don't wrap plain ValidationException, parent object will deal with it.
					value = cleaner()
				} else {
					// top level object - put plain ValidationException under field ""
					value = await guardFieldClean(errorGroups, "", cleaner)
				}
			}

			// Combine all nested validation errors
			if (errorGroups.length) {
				const errors = {}
				for (const errorGroup of errorGroups) {
					for (const field of Object.keys(errorGroup)) {
						if (!errors[field]) {
							errors[field] = []
						}
						errors[field] = errors[field].concat(errorGroup[field])
					}
				}
				throw new ValidationError(errors)
			}

			return value
		}
	})
}
