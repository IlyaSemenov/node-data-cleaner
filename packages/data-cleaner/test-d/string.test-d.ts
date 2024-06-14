import { clean } from "data-cleaner"
import { expectType } from "tsd"

expectType<string>(await clean.string()(""))

expectType<string | null>(await clean.string({ null: true })(""))

expectType<string | undefined>(await clean.string({ required: false })(""))

expectType<string | null | undefined>(
	await clean.string({ required: false, null: true })("")
)

expectType<number>(
	await clean.string().clean((value) => {
		expectType<string>(value)
		return value.length
	})("")
)
