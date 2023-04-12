import * as FLAGS from '../../src/utils/feature-flags';

export const CURRENT_FLAGS = {
  ...(window.APP_SETTINGS?.feature_flags ?? {}),
  ...(window.__FEATURE_FLAGS__ ?? {}),
  [FLAGS.FF_DEV_1170]: true,
};

Object.assign(window, {
  ...(window.APP_SETTINGS ?? {}),
  feature_flags: CURRENT_FLAGS,
});

function getFeatureFlags() {
  return {
    ...(CURRENT_FLAGS ?? {}),
    // could be used to explicitly set flags for testing, i.e. [FF_DEV_3793]: true
  };
}

export function isFF(id: string) {
  const featureFlags = getFeatureFlags();

  if (id in featureFlags) {
    return featureFlags[id] === true;
  } else {
    return window.APP_SETTINGS?.feature_flags_default_value === true;
  }
}

Object.assign(window, { getFeatureFlags, isFF });
