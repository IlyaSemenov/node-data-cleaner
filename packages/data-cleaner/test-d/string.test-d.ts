import { clean } from "data-cleaner"
import { expectType } from "tsd"

expectType<string>(await clean.string()("" as any))

expectType<number>(
	await clean.string({
		clean(value) {
			expectType<string>(value)
			return value.length
		},
	})("" as any)
)

expectType<number>(
	await clean.string<number>({
		clean(value) {
			expectType<string>(value)
			return value.length
		},
	})("" as any)
)
