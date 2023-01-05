import { cleanDate } from "data-cleaner"
import { expectType } from "tsd"

expectType<Date>(await cleanDate()(""))

expectType<string>(await cleanDate({ format: "iso" })(""))

expectType<string>(await cleanDate({ format: null })(""))

expectType<boolean>(await cleanDate<boolean>()(""))
expectType<boolean>(await cleanDate<boolean>({ format: "iso" })(""))
