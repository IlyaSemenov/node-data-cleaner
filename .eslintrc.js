module.exports = {
	root: true,
	plugins: ['prettier', 'typescript'],
	parser: 'typescript-eslint-parser',
	extends: ['prettier'],
	rules: {
		'prettier/prettier': 'warn',
	},
}
