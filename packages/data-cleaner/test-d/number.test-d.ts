import { clean } from "data-cleaner"
import { expectType } from "tsd"

expectType<number>(await clean.float()(0))
expectType<number>(await clean.integer()(0))

expectType<number | null>(await clean.float({ null: true })(0))
expectType<number | null>(await clean.integer({ null: true })(0))

expectType<number | undefined>(await clean.float({ required: false })(0))
expectType<number | undefined>(await clean.integer({ required: false })(0))

expectType<number | null | undefined>(
	await clean.float({ required: false, null: true })(0)
)
expectType<number | null | undefined>(
	await clean.integer({ required: false, null: true })(0)
)

expectType<string>(
	await clean.float().clean((value) => {
		expectType<number>(value)
		return "" + value
	})(0)
)
expectType<string>(
	await clean.integer().clean((value) => {
		expectType<number>(value)
		return "" + value
	})(0)
)
