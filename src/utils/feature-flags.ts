const FEATURE_FLAGS = window.APP_SETTINGS?.feature_flags || {};

// Fix crosshair working with zoom & rotation
export const FF_DEV_1285 = "ff_front_dev_1285_crosshair_wrong_zoom_140122_short";

export const FF_DEV_1544 = "ff_front_1544_outliner_030222_short";

export function isFF(id: string) {
  return FEATURE_FLAGS[id] === true;
}
