import { useAtomValue } from 'jotai';
import { annotationsListAtom, predictionsListAtom } from '../AnnotationsAtom';

/**
 * Combine both annotations and predictions in a single list
 */
export const useAnnotaionsList = ({
  includeAnnotations = true,
  includePredictions = true,
} = {}) => {
  const annotations = includeAnnotations ? useAtomValue(annotationsListAtom) : null;
  const predictions = includePredictions ? useAtomValue(predictionsListAtom) : null;

  return [
    ...(annotations ?? []),
    ...(predictions ?? []),
  ];
};
