'use strict';

const defaultExclude = require('@istanbuljs/schema/default-exclude');
const defaultExtension = require('@istanbuljs/schema/default-extension');

module.exports = {
  include: ['src/**'],
  exclude: ['src/examples/**', 'src/setupTests.js'].concat(defaultExclude),
  reporter: ['html'],
  reportDir: './coverageReport',
  tempDir: './coverage',
  extension: defaultExtension,
  cwd: __dirname,
};
