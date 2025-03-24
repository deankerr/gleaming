import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  react: true,
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },
}, {
  rules: {

  },
})
