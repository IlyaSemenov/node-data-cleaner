module.exports = {
	root: true,
	plugins: ['prettier', '@typescript-eslint', 'simple-import-sort'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
	},
	extends: ['prettier'],
	rules: {
		'prettier/prettier': 'warn',
		'simple-import-sort/sort': 'warn',
	},
}
