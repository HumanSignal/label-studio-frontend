import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { FC } from 'react';
import { useSDK } from 'src/App';

type AnnotationProps = {
  annotationAtom?: AnnotationAtom,
  historyItemAtom?: AnnotationAtom,
}

export const AnnotationView: FC<AnnotationProps> = ({
  annotationAtom,
  historyItemAtom,
}) => {
  const SDK = useSDK();
  const entity = historyItemAtom ?? annotationAtom;

  return (SDK.root && entity) ? SDK.tree.render({
    annotationAtom: entity,
  }) : null;
};
