import * as FLAGS from '../../src/utils/feature-flags';

Object.assign(window, {
  APP_SETTINGS: {
    ...(window.APP_SETTINGS ?? {}),
    feature_flags: {
      ...(window.APP_SETTINGS?.feature_flags ?? {}),
      ...(window.__FEATURE_FLAGS__ ?? {}),
      [FLAGS.FF_DEV_1170]: true,
    },
  },
});

function getFeatureFlags() {
  return {
    ...(window.APP_SETTINGS?.feature_flags ?? {}),
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
