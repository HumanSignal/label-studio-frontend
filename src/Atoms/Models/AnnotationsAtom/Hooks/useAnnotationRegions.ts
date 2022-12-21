import { Atom, useAtomValue } from 'jotai';
import { Annotation } from '../Types';

export const useAnnotationRegions = (annotationAtom: Atom<Annotation>) => {
  const annotaion = useAtomValue(annotationAtom);
  const regionsStore = annotaion && useAtomValue(annotaion.regions);

  return regionsStore;
};
