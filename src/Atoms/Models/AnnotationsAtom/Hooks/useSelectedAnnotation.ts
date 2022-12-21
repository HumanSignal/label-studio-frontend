import { useAtom, useSetAtom } from 'jotai';
import { SetStateAction } from 'react';
import { selectedAnnotationPropertyAtom } from '../AnnotationsAtom';
import { Annotation, AnnotationAtom } from '../Types';

type SelectedAnnotationHookResult = [
  AnnotationAtom | undefined,
  ((update: Partial<Annotation>) => void) | undefined,
  ((update?: SetStateAction<AnnotationAtom | undefined>) => void),
]

export const useSelectedAnnotation = (): SelectedAnnotationHookResult => {
  const [
    selectedAnnotaionAtom,
    setSelectedAnnotationAtom,
  ] = useAtom(selectedAnnotationPropertyAtom);

  if (!selectedAnnotaionAtom) return [
    undefined,
    undefined,
    setSelectedAnnotationAtom,
  ];

  return [
    selectedAnnotaionAtom,
    useSetAtom(selectedAnnotaionAtom),
    setSelectedAnnotationAtom,
  ];
};
