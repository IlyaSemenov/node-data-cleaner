import { cleanAny, Cleaner, ValidationError } from "data-cleaner"
import { Files } from "formidable"
import createError from "http-errors"
import Koa from "koa"

export interface CleanKoaSchema<BodyT, ReturnT> {
	body?: Cleaner<BodyT, any> // TODO: any -> type of ctx.request.body
	files?: Cleaner<Files>
	clean?: Cleaner<ReturnT, CleanKoaRequest<BodyT>>
	errorCode?: number
}

export interface CleanKoaRequest<BodyT> {
	body: BodyT
	files: Files // TODO: allow this to be optional
}

export function cleanKoa<
	BodyT = any,
	StateT = any,
	ContextT extends Koa.ParameterizedContext<StateT> = Koa.ParameterizedContext<StateT>,
	ReturnT = CleanKoaRequest<BodyT>
>(schema: CleanKoaSchema<BodyT, ReturnT>): Cleaner<ReturnT, ContextT> {
	return cleanAny<ReturnT, ContextT>({
		async clean(ctx, opts) {
			try {
				let res: any = {}
				if (schema.body) {
					res.body = await schema.body(ctx.request.body, opts)
				}
				if (schema.files) {
					res.files = await schema.files(ctx.request.files, opts)
				}
				if (schema.clean) {
					res = await schema.clean(res, opts)
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
		},
	})
}
