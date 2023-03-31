import { clean } from "data-cleaner"
import { expectType } from "tsd"

expectType<any[]>(await clean.array()([]))

expectType<string[]>(
	await clean.array({
		element(el) {
			return "" + el
		},
	})([])
)

expectType<string[] | undefined>(
	await clean.array({
		required: false,
		element(el) {
			return "" + el
		},
	})([])
)

expectType<(1 | undefined)[]>(
	await clean.array({
		element(el) {
			return el ? 1 : undefined
		},
	})([])
)
