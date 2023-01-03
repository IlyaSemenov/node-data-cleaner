import { clean } from "data-cleaner"
import { expectType } from "tsd"

expectType<string[]>(
	await clean.array({
		element(el) {
			return "" + el
		},
	})("" as any)
)

expectType<string[]>(
	await clean.array<string>({
		element(el) {
			return el
		},
	})("" as any)
)
