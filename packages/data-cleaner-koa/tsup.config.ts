import { defineConfig } from 'tsup'

export default defineConfig({
	clean: true,
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	sourcemap: true,
	dts: true,
	external: ['data-cleaner', 'formidable', 'http-errors', 'koa', 'koa-body'],
})
