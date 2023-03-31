import {
	ChainableCleaner,
	Cleaner,
	cleaner,
	ValidationError,
} from "data-cleaner"
import { Files } from "formidable"
import createError from "http-errors"
import Koa from "koa"

export interface CleanKoaSchema<BodyT = any> {
	body?: Cleaner<BodyT, any> // TODO: any -> type of ctx.request.body
	files?: Cleaner<Files>
	errorCode?: number
}

export interface CleanKoaRequest<BodyT> {
	body: BodyT
	files: Files // TODO: allow this to be optional
}

export function cleanKoa<
	V = any,
	S extends CleanKoaSchema<any> = CleanKoaSchema<any>
>(
	schema: S
): ChainableCleaner<
	CleanKoaRequest<S["body"] extends Cleaner<infer T> ? T : any>,
	V
>

export function cleanKoa(schema: CleanKoaSchema) {
	return cleaner(async (ctx: Koa.ParameterizedContext<any>, opts) => {
		try {
			const res: any = {}
			if (schema.body) {
				res.body = await schema.body(ctx.request.body, opts)
			}
			if (schema.files) {
				res.files = await schema.files(ctx.request.files, opts)
			}
			return res
		} catch (err) {
			if (err instanceof ValidationError) {
				const http_error = createError<number>(
					400,
					JSON.stringify({ errors: err.messages || err.errors }),
					{
						headers: { "Content-Type": "application/json" },
					}
				)
				if (schema.errorCode) {
					// avoid createError deprecation warning for status < 400
					http_error.status = schema.errorCode
				}
				// prevent Koa from resetting content-type, see https://github.com/koajs/koa/issues/787
				Object.defineProperty(ctx.response, "type", {
					set() {
						// do nothing.
					},
				})
				throw http_error
			}
			throw err
		}
	})
}
