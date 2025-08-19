/**
 * @type {import('@types/eslint').ESLint.ConfigData}
 */
module.exports = {
	extends: "./.eslintrc.js",

	overrides: [
		{
			files: ['./nodes/EspoCRM/**/*.ts', './nodes/EspoCRMTrigger/**/*.ts'],
			rules: {
				'n8n-nodes-base/node-filename-against-convention': 'off',
			},
		},
		{
			files: ['package.json'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			rules: {
				'n8n-nodes-base/community-package-json-name-still-default': 'error',
			},
		},
	],
};
