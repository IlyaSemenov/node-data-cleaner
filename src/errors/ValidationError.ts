export type ErrorMessage = string

export type ErrorMessages = ErrorMessage[]

export type FieldErrorMessages = {
	[field: string]: ErrorMessages
}

export class ValidationError extends Error {
	messages?: ErrorMessages
	errors?: FieldErrorMessages

	constructor(arg: ErrorMessage | ErrorMessages | FieldErrorMessages) {
		let message: ErrorMessage | undefined
		let messages: ErrorMessages | undefined
		let errors: FieldErrorMessages | undefined

		if (typeof arg === 'string') {
			messages = [arg]
			message = arg
		} else if (Array.isArray(arg)) {
			if (!arg.length) {
				throw new Error("ValidationError array argument can't empty.")
			}
			for (const i in arg) {
				const e = arg[i]
				if (!(typeof e === 'string')) {
					throw new Error(
						`ValidationError array element ${i} must be a string.`,
					)
				}
			}
			messages = arg
			message = JSON.stringify(messages)
		} else if (typeof arg === 'object') {
			if (!Object.keys(arg).length) {
				throw new Error("ValidationError object argument can't be empty.")
			}
			errors = {}
			for (const field of Object.keys(arg)) {
				const fieldArg = arg[field]
				if (typeof fieldArg === 'string') {
					errors[field] = [fieldArg]
				} else if (Array.isArray(fieldArg)) {
					if (!fieldArg.length) {
						throw new Error(
							`ValidationError field ${field} can't be empty array.`,
						)
					}
					for (const i in fieldArg) {
						const e = fieldArg[i]
						if (!(typeof e === 'string')) {
							throw new Error(
								`ValidationError field ${field} array element ${i} must be a string.`,
							)
						}
					}
					errors[field] = fieldArg
				} else {
					throw new Error(
						`ValidationError field ${field} must be a string or array.`,
					)
				}
			}
			message = JSON.stringify(errors)
		} else {
			throw new Error(
				'ValidationError argument must be a string, array or object.',
			)
		}
		super(message)
		this.messages = messages
		this.errors = errors
	}
}
