/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Annotation } from 'src/Engine/Atoms/Models/AnnotationsAtom/Types';

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
 * Callback on unskip task
 */
function onUnskipTask() {}

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
function onSelectAnnotation(annotation: Annotation, previousAnnotation: Annotation) {}

/**
 * Called when "Accept" or "Fix + Accept" is pressed
 */
function onAcceptAnnotation(store: any, entity: Annotation) {}

/**
 * Called when "Reject" is pressed
 */
function onRejectAnnotation(store: any, entity: Annotation) {}

/**
 * Called when storage gets initialized for the first time
 */
function onStorageInitialized(ls: any) {}

function onSubmitDraft(entity: any) {}

function onNextTask(nextTaskId: number) {}

function onPrevTask(prevTaskId: number) {}

export default {
  onDeleteAnnotation,
  onEntityCreate,
  onEntityDelete,
  onGroundTruth,
  onLabelStudioLoad,
  onSkipTask,
  onUnskipTask,
  onSubmitAnnotation,
  onSubmitDraft,
  onTaskLoad,
  onUpdateAnnotation,
  onSelectAnnotation,
  onAcceptAnnotation,
  onRejectAnnotation,
  onStorageInitialized,
  onNextTask,
  onPrevTask,
};
