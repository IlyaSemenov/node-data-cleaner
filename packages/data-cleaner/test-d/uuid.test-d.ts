import { clean } from "data-cleaner"
import { expectType } from "tsd"

expectType<string>(await clean.uuid()(""))

expectType<string | null>(await clean.uuid({ null: true })(""))

expectType<string | undefined>(await clean.uuid({ required: false })(""))

expectType<string | null | undefined>(
	await clean.uuid({ required: false, null: true })("")
)

expectType<number>(
	await clean.uuid().clean((value) => {
		expectType<string>(value)
		return value.length
	})("")
)
