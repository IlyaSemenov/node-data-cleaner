module.exports = {
	root: true,
	extends: [
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended',
	],
	plugins: ['simple-import-sort'],
	env: {
		node: true,
	},
	rules: {
		'prettier/prettier': 'warn',
		'simple-import-sort/imports': 'warn',
		'simple-import-sort/exports': 'warn',
	},
	overrides: [
		{
			files: ['*.js'],
			rules: {
				'@typescript-eslint/no-var-requires': 'off',
			},
		},
	],
}
