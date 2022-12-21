import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { atomWithReset, splitAtom } from 'jotai/utils';
import { isDefined } from 'src/utils/utilities';
import { InitialState } from './InitialState';
import { AnnotationAtom, AnnotationsStore } from './Types';

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
} | boolean>((get=> {
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

/**
 * Gives access to the regions of the currently selected annotation.
 */
export const annotationRegionsAtom = atom(get => {
  const annotation = get(selectedAnnotationPropertyAtom);
  const regionsStore = annotation && get(get(annotation).regions);

  return regionsStore;
});
