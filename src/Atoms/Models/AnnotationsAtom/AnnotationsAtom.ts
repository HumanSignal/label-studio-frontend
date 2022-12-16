import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { atomWithReset } from 'jotai/utils';
import { InitialState } from './InitialState';
import { AnnotationsStore } from './Types';

/**
 * Root atom for the annotations store.
 */
export const AnnotationsAtom = atomWithReset<AnnotationsStore>(InitialState);

export const AnnotationsListAtom = atom(() => {
  const annotations = focusAtom(AnnotationsAtom, (optic) => {
    return optic.prop('annotations');
  });

  return annotations;
});

/**
 * Holds the currently selected annotation or prediction.
 */
export const SelectedAnnotationAtom = focusAtom(AnnotationsAtom, (optic) => {
  return optic.prop('current');
});

/**
 * Holds the history of the currently selected annotation.
 */
export const SelectedAnnotationHistoryAtom = focusAtom(AnnotationsAtom, (optic) => {
  return optic.prop('currentHistory');
});

/**
 * Wether or not the user is in View All mode.
 */
export const ViewingAllAtom = atom((get=> {
  const viewingAllAnnotations = focusAtom(AnnotationsAtom, (optic) => {
    return optic.prop('viewingAllAnnotations');
  });
  const viewingAllPredictions = focusAtom(AnnotationsAtom, (optic) => {
    return optic.prop('viewingAllPredictions');
  });

  return get(viewingAllAnnotations) || get(viewingAllPredictions);
}));

/**
 * Configuration validation.
 */
export const ConfigValidationAtom = focusAtom(AnnotationsAtom, (optic) => {
  return optic.prop('validation');
});

/**
 * Gives access to the regions of the currently selected annotation.
 */
export const AnnotationRegionsAtom = atom(get => {
  const annotation = get(SelectedAnnotationAtom);
  const regionsStore = annotation && get(get(annotation).regions);

  return regionsStore;
});
