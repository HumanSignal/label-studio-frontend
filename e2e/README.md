# LSF E2E tests

The goal is to test the maximum possible configurations and actions
by running them inside controlled Chromium, perform actions and
check results.

You can run these tests from root by `yarn test:e2e` or by
`yarn test:e2e:headless` to do this in background without any
windows popping up (as in CI).
You can reduce tests runned with `--grep="Check transformer"`
cli parameter, it'll search through final test titles.

## Smoke tests

Simple tests to check that config is at least loaded without errors
and regions are present in there.
They all are performed inside `tests/smoke.test.js` using data
from `examples` dir. Every file there should export object with
title and required LSF params:
```js
module.exports = { config, data, result, title };
```
Also this file should be re-exported in `examples/index.js`

## Feature flags

These tests are autonomous, so flags can be set to any values.
By default they are false, so set to true flags for feature you want
to cover. Like this:

```js
LabelStudio.setFeatureFlags({
  ff_front_dev_1234_new_feature: true,
});
```
