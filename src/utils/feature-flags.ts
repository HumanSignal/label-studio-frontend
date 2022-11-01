// Fix crosshair working with zoom & rotation
export const FF_DEV_1285 = "ff_front_dev_1285_crosshair_wrong_zoom_140122_short";

// Outliner + Details
export const FF_DEV_1170 = "ff_front_1170_outliner_030222_short";

// Fix stuck userpic
export const FF_DEV_1507 = "ff_front_DEV_1507_stuck_userpic_210122_short";

// Fix shortcuts focus and cursor problems
export const FF_DEV_1564_DEV_1565 = "ff_front_dev_1564_dev_1565_shortcuts_focus_and_cursor_010222_short";

// Fix work of shortcuts in results
// @requires FF_DEV_1564_DEV_1565
export const FF_DEV_1566 = "ff_front_dev_1566_shortcuts_in_results_010222_short";

// User labels for Taxonomy
export const FF_DEV_1536 = "ff_front_dev_1536_taxonomy_user_labels_150222_long";

// New Audio 2.0 UI
export const FF_DEV_1713 = "ff_front_DEV_1713_audio_ui_150222_short";

// Add visibleWhen="choice-unselected" option
export const FF_DEV_1372 = "ff_front_dev_1372_visible_when_choice_unselected_11022022_short";

// Add an interactivity flag to the results to make some predictions' results be able to be automatically added to newly created annotations.
export const FF_DEV_1621 = "ff_front_dev_1621_interactive_mode_150222_short";

// Fix lag on first video playing start
export const FF_DEV_1265 = "ff_front_dev_1265_video_start_lag_100322_short";

// Keep enabled state of video region on area transformations
export const FF_DEV_1494 = "ff_front_dev_1494_keep_enabled_on_update_090322_short";

// Fix video timeline expanding and collapsing in full screen mode
export const FF_DEV_1270 = "ff_front_dev_1270_fullscreen_timeline_expand_090322_short";

// Add ability to generate children tags from task data
export const FF_DEV_2007_DEV_2008 = "ff_dev_2007_dev_2008_dynamic_tag_children_250322_short";

// Rework of Choices tag
export const FF_DEV_2007 = "ff_dev_2007_rework_choices_280322_short";

// Clean unnecessary classification areas after deserialization
export const FF_DEV_2100 = "ff_dev_2100_clean_unnecessary_areas_140422_short";

// Allow to use html inside <Label/> tags
export const FF_DEV_2128 = "ff_dev_2128_html_in_labels_150422_short";

// Fix preselected choices
export const FF_DEV_2100_A = "ff_dev_2100_preselected_choices_250422_short";

export const FF_DEV_2290 = "ff_front_dev_2290_draft_in_annotation_history_short";

export const FF_DEV_2394 = "ff_front_dev_2394_zoomed_transforms_260522_short";

// Make nested choices work according to the DES-107
export const FF_DEV_2244 = "ff_front_dev_2244_nested_choices_des_107_160522_short";

export const FF_DEV_2132 = "ff_front_dev_2132_rotating_bounding_box";

export const FF_DEV_2480 = "ff_dev_2480_convenient_offsets_270522_short";

export const FF_DEV_1442 = "ff_front_dev_1442_unselect_shape_on_click_outside_080622_short";

export const FF_DEV_2431 = "ff_front_dev_2431_delete_polygon_points_080622_short";

export const FF_DEV_2669 = "ff_front_dev_2669_paragraph_author_filter_210622_short";

export const FF_DEV_2432 = "ff_front_dev_2432_auto_save_polygon_draft_210622_short";

// Undo keypoints when create new polygon
export const FF_DEV_2576 = "ff_feat_front_DEV_2576_undo_key_points_polygon_short";

// Change the rotate tool from bbox
export const FF_DEV_2671 = "ff_front_dev_2671_anchor_rotate_bbox_010722_short";

export const FF_DEV_2755 = "fflag_feat_dev_2755_regions_list_grouped_by_labels_with_ordered_collapse_short";

export const FF_DEV_3034 = "fflag-feat-dev-3034-comments-with-drafts-short";

export const FF_DEV_3077 = "fflag_feat_front_dev_3077_repeater_tag_loading_performance_short";

export const FF_DEV_1598 = "ff_front_dev_1598_empty_toname_240222_short";

/**
 * Audio + Paragraphs sync playback of chunk position
 * @link https://app.launchdarkly.com/default/production/features/fflag_feat_front_dev_2461_audio_paragraphs_seek_chunk_position_short
 */
export const FF_DEV_2461 = "fflag_feat_front_dev_2461_audio_paragraphs_seek_chunk_position_short";

/**
 * Creating separated regions if selection includes hidden phrases
 * @see FF_DEV_2669 (allows filtering)
 * @link https://app.launchdarkly.com/default/production/features/fflag_fix_front_dev_2918_labeling_filtered_paragraphs_250822_short
 */
export const FF_DEV_2918 = "fflag_fix_front_dev_2918_labeling_filtered_paragraphs_250822_short";

/**
 * Correction of image and stage size. It also affects the zoom position restrictions.
 * @link https://app.launchdarkly.com/default/production/features/fflag_fix_front_dev_3377_image_regions_shift_on_resize_280922_short
 */
export const FF_DEV_3377 = "fflag_fix_front_dev_3377_image_regions_shift_on_resize_280922_short";

function getFeatureFlags() {
  return window.APP_SETTINGS?.feature_flags || {
    // ff_front_DEV_1713_audio_ui_150222_short: true,
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
