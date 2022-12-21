import { Annotation } from '@atoms/Models/AnnotationsAtom/Types';
import { Atom } from 'jotai';
import { FC } from 'react';
import { useSDK } from 'src/App';

type AnnotationProps = {
  annotationAtom?: Atom<Annotation>,
  historyItemAtom?: Atom<Annotation>,
}

export const AnnotationView: FC<AnnotationProps> = ({
  annotationAtom,
  historyItemAtom,
}) => {
  const SDK = useSDK();
  const entity = historyItemAtom ?? annotationAtom;

  return (SDK.root && entity) ? SDK.tree.render({
    annotationEntity: entity,
  }) : null;
};
