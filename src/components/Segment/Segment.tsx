import { FC, useEffect } from 'react';
import { Annotation } from 'src/Engine/Atoms/Models/AnnotationsAtom/Types';

import styles from './Segment.module.scss';

interface SegmentProps {
  annotation?: Annotation;
  className?: string;
  children?: React.ReactNode;
}

export const Segment: FC<SegmentProps> = (props) => {
  useEffect(() => {
    // const { annotation } = props;

    // if (annotation) annotation.updateObjects();
  });

  let cn = styles.block;

  if (props.className) cn = cn + ' ' + props.className;

  return <div className={cn}>{props.children}</div>;
};
