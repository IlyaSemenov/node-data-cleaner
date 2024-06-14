import { clean } from "data-cleaner"
import { expectType } from "tsd"

expectType<string>(await clean.email()(""))

expectType<string | null>(await clean.email({ null: true })(""))

expectType<string | undefined>(await clean.email({ required: false })(""))

expectType<string | null | undefined>(
	await clean.email({ required: false, null: true })("")
)

expectType<number>(
	await clean.email().clean((value) => {
		expectType<string>(value)
		return value.length
	})("")
)
