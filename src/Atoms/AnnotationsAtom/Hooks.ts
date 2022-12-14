import { useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { splitAtom } from 'jotai/vanilla/utils';
import { AnnotationsAtom } from './AnnotationsAtom';
import { Annotation, AnnotationHistoryItem, Prediction } from './Types';

const AnnotationNamesAtom = focusAtom(AnnotationsAtom , (optics) => {
  return optics.prop('names');
});

export const useAnnotationsNames = () => {
  const names = useAtomValue(AnnotationNamesAtom);

  return names;
};

export const useRegions = (annotation: Annotation | Prediction | AnnotationHistoryItem) => {
  const regionsStore = annotation && useAtomValue(annotation.regions);
  const regions = regionsStore && splitAtom(regionsStore.regions);

  return {
    regions,
    selection: regionsStore?.selection,
  };
};
