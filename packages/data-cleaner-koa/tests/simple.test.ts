import { clean } from "data-cleaner"
import { cleanKoa } from "data-cleaner-koa"
import tap from "tap"

tap.test("simple", async (tap) => {
	const clean_request = cleanKoa({ body: clean.integer() })
	tap.strictSame(await clean_request({ request: { body: 123 } } as any), {
		body: 123,
	})
})
