import { cleanDate } from "data-cleaner"
import { expectType } from "tsd"

expectType<Date>(await cleanDate()(""))
expectType<string>(await cleanDate({ format: "iso" })(""))
expectType<string>(await cleanDate({ format: null })(""))

expectType<Date | null | undefined>(
	await cleanDate({ required: false, null: true })("")
)
expectType<string | null | undefined>(
	await cleanDate({ format: "iso", required: false, null: true })("")
)
expectType<string | null | undefined>(
	await cleanDate({ format: null, required: false, null: true })("")
)
