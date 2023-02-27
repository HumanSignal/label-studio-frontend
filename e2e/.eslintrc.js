module.exports = {
  plugins: [
    'codeceptjs',
  ],
  globals: {
    Htx: true,
    Feature: true,
    Scenario: true,
    Data: true,
    DataTable: true,
    locate: true,
    actor: true,
    inject: true,
    session: true,
    pause: true,
  },
  rules: {
    'codeceptjs/no-exclusive-tests': 'error',
    'codeceptjs/no-skipped-tests': 'warn',
    'codeceptjs/no-pause-in-scenario': 'error',
  },
};
