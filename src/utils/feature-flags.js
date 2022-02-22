// Fix crosshair working with zoom & rotation
export const FF_DEV_1285 = "ff_front_dev_1285_crosshair_wrong_zoom_140122_short";

// Fix stuck userpic
export const FF_DEV_1507 = "ff_front_DEV_1507_stuck_userpic_210122_short";

// Auto-annotation regions are not visible until refresh
export const FF_DEV_1555 = "ff_front_dev_1555_auto_annotations_not_visible";

// Fix shortcuts focus and cursor problems
export const FF_DEV_1564_DEV_1565 = "ff_front_dev_1564_dev_1565_shortcuts_focus_and_cursor_010222_short";

// Fix work of shortcuts in results
// @requires FF_DEV_1564_DEV_1565
export const FF_DEV_1566 = "ff_front_dev_1566_shortcuts_in_results_010222_short";

// User labels for Taxonomy
export const FF_DEV_1536 = "ff_front_dev_1536_taxonomy_user_labels_150222_long";

// Show or not dialog for rejection
export const FF_DEV_1593 = "ff_front_1593_rejection_comment_040222_short";

// Add visibleWhen="choice-unselected" option
export const FF_DEV_1372 = "ff_front_dev_1372_visible_when_choice_unselected_11022022_short";

// Add an interactivity flag to the results to make some predictions' results be able to be automatically added to newly created annotations.
export const FF_DEV_1621 = "ff_front_dev_1621_interactive_mode_150222_short";

function getFeatureFlags() {
  return window.APP_SETTINGS?.feature_flags || {};
}

export function isFF(id) {
  const featureFlags = getFeatureFlags();

  if (id in featureFlags) {
    return featureFlags[id] === true;
  } else {
    return window.APP_SETTINGS?.feature_flags_default_value === true;
  }
}
