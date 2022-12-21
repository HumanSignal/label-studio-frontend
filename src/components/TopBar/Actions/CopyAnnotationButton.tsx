import { Annotation } from '@atoms/Models/AnnotationsAtom/Types';
import { FC } from 'react';
import { IconCopy } from 'src/assets/icons';
import { Button } from 'src/common/Button/Button';
import { Tooltip } from 'src/common/Tooltip/Tooltip';

type CopyAnnotationProps = {
  visible: boolean,
  entityType: Annotation['type'],
  onCopyAnnotation: () => void,
}

export const CopyAnnotation: FC<CopyAnnotationProps> = (props) => {
  return props.visible ? (
    <Tooltip title={`Create copy of current ${props.entityType}`}>
      <Button
        icon={<IconCopy style={{ width: 36, height: 36 }}/>}
        size="small"
        type="text"
        aria-label="Copy Annotation"
        onClick={(ev) => {
          ev.preventDefault();

          props.onCopyAnnotation();
        }}
        style={{
          height: 36,
          width: 36,
          padding: 0,
        }}
      />
    </Tooltip>
  ) : null;
};
