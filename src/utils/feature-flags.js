const FEATURE_FLAGS = window.APP_SETTINGS?.feature_flags || {};

// Fix crosshair working with zoom & rotation
export const FF_DEV_1285 = "ff_front_dev_1285_crosshair_wrong_zoom_140122_short";

// Fix stuck userpic
export const FF_DEV_1507 = "ff_front_DEV_1507_stuck_userpic_210122_short";

// Auto-annotation regions are not visible until refresh
export const FF_DEV_1555 = "ff_front_dev_1555_auto_annotations_not_visible";

// Rendering audio inside view-all (havy file/slow connection)
export const FF_DEV_1633 = "ff_front_dev_1633_viewall_audio_03022022_short";

export function isFF(id) {
  return FEATURE_FLAGS[id] === true;
}
