import { useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { annotationsAtom } from '../AnnotationsAtom';

const AnnotationNamesAtom = focusAtom(annotationsAtom , (optics) => {
  return optics.prop('names');
});

export const useAnnotationNames = () => {
  const names = useAtomValue(AnnotationNamesAtom);

  return names;
};
