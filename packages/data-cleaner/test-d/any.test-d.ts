import { clean } from "data-cleaner"
import { expectError, expectType } from "tsd"

expectType<any>(await clean.any()(""))

expectType<string>(await clean.any<string>()(""))

expectType<string | null>(
	await clean.any<string, { null: true }>({ null: true })("")
)

// TODO:
// expectError(clean.any<string, { null: true }>())
// - we can achieve that with two declarations of cleanAny (one without arg, one with non-optional arg)

expectError(clean.any<string, { null: true }>({ null: false }))

expectError(await clean.any<string>()(123))
