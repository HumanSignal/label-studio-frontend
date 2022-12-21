import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { useAtom } from 'jotai';
import { FC, MouseEvent, useCallback, useMemo } from 'react';
import { LsStar } from '../../assets/icons';
import { Button } from '../../common/Button/Button';
import { Tooltip } from '../../common/Tooltip/Tooltip';
import { BemWithSpecifiContext } from '../../utils/bem';
import './GroundTruth.styl';

const { Block, Elem } = BemWithSpecifiContext();

type GroundTruthProps = {
  annotationAtom: AnnotationAtom,
  disabled?: boolean,
  size?: 'sm' | 'md',
};

export const GroundTruth: FC<GroundTruthProps> = ({
  annotationAtom,
  disabled = false,
  size = 'md',
}) => {
  const [selectedEntity, setSelectedEntity] = useAtom(annotationAtom);

  const shouldRender = useMemo(() => {
    return !selectedEntity.skipped && !selectedEntity.userGenerate && selectedEntity.type !== 'prediction';
  }, [
    selectedEntity.skipped,
    selectedEntity.userGenerate,
    selectedEntity.type,
  ]);

  const setGroundTruth = useCallback((value: boolean) => {
    setSelectedEntity((prev) => ({ ...prev, ground_truth: value }));
  }, []);

  const onToggleGroundTruth = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setGroundTruth(!selectedEntity.ground_truth);
  }, [selectedEntity.ground_truth]);


  const title = useMemo(() => {
    return selectedEntity.ground_truth
      ? 'Unset this result as a ground truth'
      : 'Set this result as a ground truth';
  }, [selectedEntity.ground_truth]);

  return shouldRender ? (
    <Block name="ground-truth" mod={{ disabled, size }}>
      <Tooltip title={title}>
        <Elem
          tag={Button}
          name="toggle"
          size="small"
          type="link"
          onClick={onToggleGroundTruth}
        >
          <Elem
            name="indicator"
            tag={LsStar}
            mod={{ active: selectedEntity.ground_truth }}
          />
        </Elem>
      </Tooltip>
    </Block>
  ) : null;
};
