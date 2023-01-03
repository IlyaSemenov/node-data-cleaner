import { clean } from "data-cleaner"
import { expectType } from "tsd"

expectType<{ name: string; active: boolean }>(
	await clean.object({
		fields: {
			name: clean.string(),
			active: clean.boolean(),
		},
	})(0 as any)
)

expectType<{ name: string; active: boolean }>(
	await clean.object<{ name: string; active: boolean }>({
		fields: {
			name: clean.string(),
			active: clean.boolean(),
		},
	})("" as any)
)

expectType<{ name: string; active: boolean; count: number }>(
	await clean.object({
		fields: {
			name: clean.string(),
			active: clean.boolean(),
		},
		clean(value) {
			// будет ошибка 'value' implicitly has 'any' time
			// если делать clean неопциальным в AnySchema при несовпадении типов
			expectType<{ name: string; active: boolean }>(value)
			return { ...value, count: 5 }
		},
	})("" as any)
)

expectType<{ name: string; active: boolean; some: string; count: number }>(
	await clean.object({
		required: true,
		fields: {
			name: clean.string(),
			active: clean.boolean(),
		},
		clean(value: { name: string; active: boolean; some: string }) {
			return { ...value, count: 5 }
		},
	})("" as any)
)

// указано что раньше была такая ошибка, но на момент конвертации в tsd тесты я ее не вижу
// Cleaner<unknown> not assignable to Cleaner<any>
expectType<{ name: string; active: boolean; count: number }>(
	await clean.object({
		required: true,
		fields: {
			name: clean.string(),
			active: clean.boolean<boolean>(),
		},
		clean(value) {
			expectType<{ name: string; active: boolean }>(value)
			return { ...value, count: 5 }
		},
	})("" as any)
)

// указано что раньше была такая ошибка, но на момент конвертации в tsd тесты я ее не вижу
// Cleaner<unknown> not assignable to Cleaner<any>
expectType<{ name: string; active: number; some: string; count: number }>(
	await clean.object({
		required: true,
		fields: {
			name: clean.string(),
			active: clean.boolean<number>(),
		},
		clean(value: { name: string; active: number; some: string }) {
			return { ...value, count: 5 }
		},
	})("" as any)
)

expectType<{ name: string; count: number }>(
	await clean.object<{ name: string; count: number }>({
		fields: {
			name: clean.string(),
			count: clean.boolean(), // boolean, not number!
		},
	})("" as any)
)

expectType<{ name: string; active: boolean; count: number }>(
	await clean.object<{
		name: string
		active: boolean
		count: number
	}>({
		fields: {
			name: clean.string(),
			active: clean.boolean(),
		},
	})("" as any)
)
