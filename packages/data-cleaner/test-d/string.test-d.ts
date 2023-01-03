import { clean } from "data-cleaner"
import { expectType } from "tsd"

expectType<string>(await clean.string()("" as any))

expectType<number>(
	await clean.string<number, string>({
		clean(value) {
			return value.length
		},
	})("" as any)
)

expectType<number>(
	await clean.string({
		clean(value: string) {
			return value.length
		},
	})("" as any)
)

clean.string({
	clean(value) {
		// будет ошибка, если делать clean неопциальным в AnySchema при несовпадении типов
		expectType<string>(value)
		return value.length
	},
})
