import { clean } from "data-cleaner"
import { expectError, expectType } from "tsd"

expectType<string>(await clean.any<string>()(""))

expectType<string>(await clean.any<string>()(123))

expectType<string>(await clean.any<string, number>()(123))

expectError(await clean.any<string, number>()(""))
