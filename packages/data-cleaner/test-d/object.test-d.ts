import { clean } from "data-cleaner"
import { expectType } from "tsd"

expectType<{ name: string; active: boolean }>(
	await clean.object({
		fields: {
			name: clean.string(),
			active: clean.boolean(),
		},
	})({})
)

expectType<{ name: string | undefined; active: boolean | null }>(
	await clean.object({
		fields: {
			name: clean.string({ required: false }),
			active: clean.boolean({ null: true }),
		},
	})({})
)

expectType<{ name: string; active: boolean | null } | undefined>(
	await clean.object({
		fields: {
			name: clean.string(),
			active: clean.boolean({ null: true }),
		},
		required: false,
	})({})
)

expectType<{ name: string; active: boolean; count: number }>(
	await clean
		.object({
			required: true,
			fields: {
				name: clean.string(),
				active: clean.boolean(),
			},
		})
		.clean((value) => {
			expectType<{ name: string; active: boolean }>(value)
			return { ...value, count: 5 }
		})({})
)
