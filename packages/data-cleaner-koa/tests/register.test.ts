import "data-cleaner-koa/register"

import { clean } from "data-cleaner"
import tap from "tap"

tap.test("simple", async (tap) => {
	const clean_request = clean.koa({ body: clean.integer() })
	tap.strictSame(await clean_request({ request: { body: 123 } } as any), {
		body: 123,
	})
})
