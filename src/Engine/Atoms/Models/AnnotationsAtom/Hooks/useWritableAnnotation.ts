import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { selectedAnnotationPropertyAtom } from '../AnnotationsAtom';
import { Annotation, AnnotationAtom } from '../Types';

type WritableAnnotationHookResult = [
  AnnotationAtom,
  ((update: Partial<Annotation>) => void),
  ((update: AnnotationAtom) => void),
]

export const useWriteableAnnotation = (
  annotaionAtom?: AnnotationAtom,
): WritableAnnotationHookResult => {
  const setSelectedAnnotation = useSetAtom(selectedAnnotationPropertyAtom);

  const setSelectedAnnotationAtom = useCallback((update: AnnotationAtom) => {
    setSelectedAnnotation(update);
  }, []);

  return [
    annotaionAtom!,
    useSetAtom(annotaionAtom! as AnnotationAtom),
    setSelectedAnnotationAtom,
  ];
};
