import { ValidationError } from "../errors/ValidationError"
import { getMessage, LimitTo } from "../utils"
import { AnySchema, cleanAny, setSchema } from "./any"

export type BooleanSchema<T, M extends TypeM<T> = TypeM<T>> = AnySchema<
	T,
	M
> & {
	cast?: boolean
	omit?: boolean
}

type TypeM<T> = LimitTo<T, boolean | null | undefined>

export function cleanBoolean<T = boolean, M extends TypeM<T> = TypeM<T>>(
	schema: BooleanSchema<T, M> = {} as BooleanSchema<T, M>
) {
	const cleaner = cleanAny<T>({
		required: schema.required,
		default: schema.default,
		null: schema.null,
		clean(value, context) {
			let res: M = value
			if (!(res === undefined || res === null)) {
				if (typeof res !== "boolean" && schema.cast !== true) {
					throw new ValidationError(
						getMessage(context, "invalid", "Invalid value.")
					)
				}
				res = !!res as M // TODO: only do this if not boolean
				if (res === false && schema.omit === true) {
					res = undefined as M
				}
			}
			return schema.clean ? schema.clean(res, context) : (res as unknown as T)
		},
	})
	return setSchema(cleaner, schema)
}
