module.exports = {
  globals: {
    process: true,
    module: true,
    require: true,
    __dirname: true,
  },
  extends: ['plugin:@heartexlabs/frontend/recommended'],
  rules: {
    '@typescript-eslint/indent': 'off',
  },
};
