module.exports = {
	root: true,
	plugins: ['prettier', '@typescript-eslint'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
	},
	extends: ['prettier'],
	rules: {
		'prettier/prettier': 'warn',
	},
}
