import cleaner from 'rollup-plugin-cleaner'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.umd.js',
    format: 'umd',
    name: 'dataCleaner',
    sourcemap: true,
  },
  plugins: [
		cleaner({ targets: ['./dist/'] }),
    typescript(),
  ]
}
