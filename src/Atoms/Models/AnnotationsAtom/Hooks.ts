import { Atom, useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { AnnotationsAtom, AnnotationsListAtom, PredictionsListAtom, SelectedAnnotationAtom } from './AnnotationsAtom';
import { AnnotationHistoryItem, AnnotationOrPrediction } from './Types';

const AnnotationNamesAtom = focusAtom(AnnotationsAtom , (optics) => {
  return optics.prop('names');
});

export const useAnnotationsNames = () => {
  const names = useAtomValue(AnnotationNamesAtom);

  return names;
};

export const useRegions = (annotationAtom: Atom<AnnotationOrPrediction | AnnotationHistoryItem>) => {
  const annotaion = useAtomValue(annotationAtom);
  const regionsStore = annotaion && useAtomValue(annotaion.regions);

  return regionsStore;
};

export const useSelectedAnnotation = () => {
  const selectedAtom = useAtomValue(SelectedAnnotationAtom);

  return selectedAtom ? useAtomValue(selectedAtom) : null;
};

/**
 * Combine both annotations and predictions in a single list
 */
export const useAnnotaionsList = ({
  includeAnnotations = true,
  includePredictions = true,
} = {}) => {
  const annotations = includeAnnotations ? useAtomValue(AnnotationsListAtom) : null;
  const predictions = includePredictions ? useAtomValue(PredictionsListAtom) : null;

  return [
    ...(annotations ?? []),
    ...(predictions ?? []),
  ];
};
