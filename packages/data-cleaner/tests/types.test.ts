//
// THIS IS NOT AN ACTUAL TEST FILE, BUT SIMPLY A DRAFT FOR CHECKING ERRORS MANUALLY IN IDE
//

import * as clean from "../src"

// OK
const s = clean.string()

// OK
const s2 = clean.string<number, string>({
	clean(value) {
		return value.length
	},
})

// OK
const s3 = clean.string({
	clean(value: string) {
		return value.length
	},
})

// was BAD: 'value' is 'any' - если делать clean неопциальным в AnySchema при несовпадении типов
// OK
const s4 = clean.string({
	clean(value) {
		return value.length
	},
})

// OK
const cleaner_auto = clean.object({
	fields: {
		string: clean.string(),
		boolean: clean.boolean(),
	},
})

// OK
async function cleaner_t() {
	const { string: s } = await cleaner_auto(null)
	console.log(s)
}

// OK
const cleaner_typed = clean.object<{ string: string; boolean: boolean }>({
	fields: {
		string: clean.string(),
		boolean: clean.boolean(),
	},
})

// BAD: Only returns { count }
// was OK: { count: active } | { full_obj } - в какой-то момент добился этого, потом проебал
// was BAD: 'value' implicitly has 'any' time - если делать clean неопциальным в AnySchema при несовпадении типов
const cleaner_custom = clean.object({
	fields: {
		phone: clean.string(),
		active: clean.boolean(),
	},
	clean(value) {
		return { ...value, count: 5 }
	},
})

// OK (4 поля)
const cleaner_custom_typed = clean.object({
	required: true,
	fields: {
		phone: clean.string(),
		active: clean.boolean(),
	},
	clean(value: { phone: string; active: boolean; some: string }) {
		return { ...value, count: 5 }
	},
})

// BAD (3 поля)
const cleaner_typed_custom = clean.object<{
	phone: string
	active: boolean
	some: string
}>({
	required: true,
	fields: {
		phone: clean.string(),
		active: clean.boolean(),
	},
	clean(value) {
		return { ...value, count: 5 }
	},
})

// BAD: phone: Cleaner<unknown> not assignable to Cleaner<any>
const cleaner_custom_typed_explicit = clean.object({
	required: true,
	fields: {
		phone: clean.string(),
		active: clean.boolean<boolean>(),
	},
	clean(value: { phone: string; active: boolean }) {
		return { ...value, count: 5 }
	},
})

// BAD: phone, boo: Cleaner<unknown> not assignable to Cleaner<any>
const cleaner_custom_typed_active_changed = clean.object({
	required: true,
	fields: {
		phone: clean.string(),
		active: clean.boolean<number>(),
	},
	clean(value: { phone: string; active: number; some: string }) {
		return { ...value, count: 5 }
	},
})

// OK
const cleaner_v = clean.object<{ phone: string; count: number }>({
	fields: {
		phone: clean.string(),
		count: clean.boolean(),
	},
})

// OK
const cleaner_v_extra = clean.object<{
	phone: string
	active: boolean
	count: number
}>({
	fields: {
		phone: clean.string(),
		active: clean.boolean(),
	},
})

// OK
const cleaner_v_extra_clean = clean.object<
	{ phone: string; active: boolean },
	{
		phone?: string
		active?: boolean
		count: number
	}
>({
	fields: {
		phone: clean.string(),
		active: clean.boolean(),
	},
	clean(value) {
		return { ...value, count: 5 }
	},
})

// OK
const arr_cl = clean.array<string>({
	element(el) {
		return el
	},
})
