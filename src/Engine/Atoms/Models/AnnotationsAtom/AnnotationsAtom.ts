import { AnnotationInput } from '@atoms/Inputs/AnnotationInput';
import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { atomWithReset, splitAtom } from 'jotai/utils';
import { guidGenerator } from 'src/utils/unique';
import { isDefined } from 'src/utils/utilities';
import { InitialState } from './InitialState';
import { Annotation, AnnotationAtom, AnnotationsStore, EntityType } from './Types';

/**
 * Root atom for the annotations store.
 */
export const annotationsAtom = atomWithReset<AnnotationsStore>(InitialState);

/**
 * List all available annotations
 */
export const annotationsListAtom = focusAtom(annotationsAtom, (optic) => {
  return optic.prop('annotations');
});

/**
 * Lists all available annotations, but in atomic way.
 * Allows modyfiying the list without having to worry about the rest of the store.
 */
export const writableAnnotationsListAtom = splitAtom(annotationsListAtom);

/**
 * List all available predictions
 */
export const predictionsListAtom = focusAtom(annotationsAtom, (optic) => {
  return optic.prop('predictions');
});

/**
 * Lists all available predictions, but in atomic way.
 * Allows modyfiying the list without having to worry about the rest of the store.
 */
export const writablePredictionsListAtom = splitAtom(predictionsListAtom);

/**
 * Holds the currently selected annotation or prediction.
 */
export const selectedAnnotationPropertyAtom = focusAtom(annotationsAtom, (optic) => {
  return optic.prop('current');
});

/**
 * Holds the history of the currently selected annotation.
 */
export const selectedAnnotationHistoryAtom = focusAtom(annotationsAtom, (optic) => {
  return optic.prop('currentHistory');
});

/**
 * Represents the currently selected annotation or prediction or annotation history item.
 */
export const selectedAnnotationAtom = atom<
AnnotationAtom | undefined,
AnnotationAtom
>(get => {
  const selectedAnnotation = get(selectedAnnotationPropertyAtom);
  const selectedAnnotationHistory = get(selectedAnnotationHistoryAtom);

  return selectedAnnotationHistory || selectedAnnotation;
}, (get, set, value) => {
  const type = get(value).type;

  if (type === 'history') {
    set(selectedAnnotationHistoryAtom, value);
  } else {
    set(selectedAnnotationPropertyAtom, value);
  }
});


const viewingAllAnnotationsAtom = focusAtom(annotationsAtom, (optic) => {
  return optic.prop('viewingAllAnnotations');
});

const viewingAllPredictionsAtom = focusAtom(annotationsAtom, (optic) => {
  return optic.prop('viewingAllPredictions');
});


/**
 * Wether or not the user is in View All mode.
 */
export const viewingAllAtom = atom<boolean, {
  predictions?: boolean,
  annotations?: boolean,
} | boolean>(((get) => {
  return get(viewingAllAnnotationsAtom) || get(viewingAllPredictionsAtom);
}), (get, set, value) => {
  if (typeof value === 'object') {
    if (isDefined(value.annotations))
      set(viewingAllAnnotationsAtom, value.annotations);
    if (isDefined(value.predictions))
      set(viewingAllPredictionsAtom, value.predictions);

    return;
  }

  set(viewingAllAnnotationsAtom, value);
  set(viewingAllPredictionsAtom, value);
});

/**
 * Configuration validation.
 */
export const configValidationAtom = focusAtom(annotationsAtom, (optic) => {
  return optic.prop('validation');
});

export const createAnnotationAtom = (
  input: Partial<AnnotationInput & {
    saved: boolean,
    userCreated: boolean,
  }>,
  type: EntityType,
): AnnotationAtom => {
  const initialValue = {
    id: input.id ?? guidGenerator(),
    type: type ?? 'annotation',
    saved: input.saved ?? false,
    userCreated: input.userCreated ?? false,
    commentCount: 0,
    unresolvedCommentCount: 0,
    groundTruth: input.groundTruth,
    skipped: input.skipped ?? false,
    acceptedState: input.acceptedState,
    editable: !input.readonly,
    createdBy: input.createdBy ?? 'admin',
    createdDate: input.createdDate ?? (new Date()).toISOString(),
  };

  return atom<Annotation>(initialValue);
};
