import cleaner from 'rollup-plugin-cleaner'
import typescript from 'rollup-plugin-typescript2'

export default {
	input: 'src/index.ts',
	output: {
		file: 'dist/index.js',
		format: 'cjs',
		sourcemap: true,
	},
	plugins: [
		cleaner({ targets: ['./dist/'] }),
		typescript({
			tsconfigOverride: {
				include: ['src'],
			},
		}),
	],
	external: ['email-validator', 'capital-case'],
}
