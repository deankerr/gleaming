import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: {
    overridesTypeAware: [
      {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
          'ts/strict-boolean-expressions': [
            'error',
            {
              allowNullableString: true,
            },
          ],
        },
      },
    ],
  },
  react: false,
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },
  ignores: ['worker-configuration.d.ts', 'notes/**'],
  rules: {
    'no-console': 'warn',
  },

})
