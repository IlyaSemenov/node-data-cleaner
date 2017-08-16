const clean = {}

class SchemaError extends Error {}

class ValidationError extends Error {
	// Can be one of two:
	//
	// Field-unaware error:
	// err.messages = ['err1', 'err2', ...]

	// or field-aware error:
	// err.errors = {field1: ['err1', 'err2', ...], field2: ['err3', ...], ...}

	constructor(err) {
		super()
		let message
		if (Array.isArray(err)) {
			this.messages = err
			this.message = JSON.stringify(this.messages)
		} else if (typeof err === "object") {
			this.errors = {}
			for (const field of Object.keys(err)) {
				const e = err[field]
				this.errors[field] = Array.isArray(e) ? e : [e]
			}
			this.message = JSON.stringify(this.errors)
		} else {
			this.messages = [err]
			this.message = err
		}
	}
}

function getMessage(opts, name, defaultText) {
	return (opts && opts.messages && opts.messages[name]) || defaultText
}

clean.any = function(schema = {}) {
	return async function(value, opts) {
		if (value === undefined && !(schema.required === false)) {
			throw new ValidationError(getMessage(opts, 'required', "Value required."))
		}
		if (value === null && !(schema.null === true)) {
			throw new ValidationError(getMessage(opts, 'required', "Value required."))
		}
		if (schema.clean) {
			value = schema.clean(value, opts)
		}
		return value
	}
}

clean.string = function(schema = {}) {
	return clean.any({
		...schema,
		clean(value, opts) {
			if (!(value === undefined || value === null)) {
				if (typeof value === "object" && !(schema.allowObject === true)) {
					throw new ValidationError(getMessage(opts, 'invalid', "Invalid value."))
				}
				value = String(value)
				if (!value && !(schema.blank === true)) {
					throw new ValidationError(getMessage(opts, 'required', "Value required."))
				}
			}
			if (schema.clean) {
				value = schema.clean(value, opts)
			}
			return value
		}
	})
}

async function guardFieldClean(errors, field, cleaner) {
	try {
		return await Promise.resolve(cleaner())
	} catch (err) {
		if (err instanceof ValidationError) {
			if (err.errors) {
				errors.push(err.errors)
			} else {
				errors.push({[field]: err.messages})
			}
			return undefined
		}
		throw err
	}
}

clean.object = function(schema = {}) {
	if (typeof schema.fields !== "object") {
		throw new SchemaError("clean.object schema must include fields.")
	}
	return clean.any({
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

module.exports = {
	...clean,
	SchemaError,
	ValidationError,
}
