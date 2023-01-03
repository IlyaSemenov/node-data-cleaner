import { clean } from "data-cleaner"

import { cleanKoa } from "./clean-koa"

declare module "data-cleaner" {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace clean {
		let koa: typeof cleanKoa
	}
}

clean.koa = cleanKoa
