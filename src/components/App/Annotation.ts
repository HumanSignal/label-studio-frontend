import { FC } from 'react';
import { useSDK } from 'src/App';
import { AnnotationAtom } from 'src/Engine/Atoms/Models/AnnotationsAtom/Types';

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
