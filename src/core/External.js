/**
 * Callback on submit annotation
 */
function onSubmitAnnotation() {}

/**
 * Callback on update annotation
 */
function onUpdateAnnotation() {}

/**
 * Callback on delete annotation
 */
function onDeleteAnnotation() {}

/**
 * Callback on skip task
 */
function onSkipTask() {}

/**
 * Callback on task load
 */
function onTaskLoad() {}

/**
 * Callback on Label Studio load
 */
function onLabelStudioLoad() {}

/**
 * Callback when labeled region gets created
 */
function onEntityCreate() {}

/**
 * Callback when labeled region gets deleted
 */
function onEntityDelete() {}

/**
 * Callback when ground truth button gets pressed
 */
function onGroundTruth() {}

/**
 * Callback when a new annotation gets selected
 */
function onSelectAnnotation(annotation, previousAnnotation) {}

export default {
  onDeleteAnnotation,
  onEntityCreate,
  onEntityDelete,
  onGroundTruth,
  onLabelStudioLoad,
  onSkipTask,
  onSubmitAnnotation,
  onTaskLoad,
  onUpdateAnnotation,
  onSelectAnnotation,
};
