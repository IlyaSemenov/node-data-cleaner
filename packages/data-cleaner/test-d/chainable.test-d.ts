import { cleaner } from "data-cleaner"
import { expectError, expectType } from "tsd"

const c0 = (x: number) => x
const v0 = c0(123)
expectType<number>(v0)

const c1 = cleaner(c0)
const v1 = await c1(1)
expectType<number>(v1)

const c2 = c1.clean(() => "foo" as const)
const v2 = await c2(1)
expectType<"foo">(v2)

const c3 = c2.clean((s) => s.length)
const v3 = await c3(1)
expectType<number>(v3)

const c4 = cleaner<number, string>((x) => x.length)
	.clean((len) => {
		expectType<number>(len)
		return len > 5
	})
	.clean((isLong) => {
		expectType<boolean>(isLong)
		return !isLong
	})
const v4 = await c4("some")
expectType<boolean>(v4)
expectError(c4(123))
