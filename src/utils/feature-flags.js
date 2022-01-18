const FEATURE_FLAGS = window.APP_SETTINGS?.feature_flags || {};

// Fix crosshair working with zoom & rotation
export const FF_DEV_1285 = "ff_front_dev_1285_crosshair_wrong_zoom_140122_short";

export function isFF(id) {
  return FEATURE_FLAGS[id] === true;
}
