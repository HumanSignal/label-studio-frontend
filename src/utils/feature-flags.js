const FEATURE_FLAGS = window.APP_SETTINGS?.feature_flags || {};

export function isFF(id) {
  return FEATURE_FLAGS[id] === true;
}
