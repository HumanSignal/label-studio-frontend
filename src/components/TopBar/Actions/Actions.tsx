import { viewingAllAtom } from '@atoms/Models/AnnotationsAtom/AnnotationsAtom';
import { useAnnotationsController } from '@atoms/Models/AnnotationsAtom/Controller';
import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { useInstructions, useInterfaces } from '@atoms/Models/RootAtom/Hooks';
import { useSettingsVisibility } from '@atoms/Models/SettingsAtom/Hooks';
import { useAtom, useAtomValue } from 'jotai';
import { FC, useCallback, useMemo } from 'react';
import { IconViewAll, LsSettings, LsTrash } from '../../../assets/icons';
import { Button } from '../../../common/Button/Button';
import { confirm } from '../../../common/Modal/Modal';
import { Tooltip } from '../../../common/Tooltip/Tooltip';
import { Elem } from '../../../utils/bem';
import { GroundTruth } from '../../CurrentEntity/GroundTruth';
import { CopyAnnotation } from './CopyAnnotationButton';
import { InstructionsButton } from './InstructionsButton';

type ActionsProps = {
  annotationAtom: AnnotationAtom,
}

export const Actions: FC<ActionsProps> = ({
  annotationAtom,
}) => {
  const hasInterface = useInterfaces();
  const [settingsVisible, toggleSettings] = useSettingsVisibility();
  const [instructions, instructionsVisible, setInstructionsVisibility] = useInstructions();
  const annotationsController = useAnnotationsController();
  const [viewingAll, setViewingAll] = useAtom(viewingAllAtom);
  const entity = useAtomValue(annotationAtom);

  const saved = useMemo(() => {
    if (!entity.userGenerate || entity.sentUserGenerate) return true;
    return false;
  }, [entity.userGenerate, entity.sentUserGenerate]);

  // const isPrediction = entity?.type === 'prediction';

  const onToggleVisibility = useCallback(() => {
    setViewingAll(!viewingAll);
  }, [viewingAll]);

  const onCopyAnnotation = useCallback(() => {
    const prediction = annotationsController.annotationToPrediction(annotationAtom);

    // this is here because otherwise React doesn't re-render the change in the tree
    window.setTimeout(function() {
      annotationsController.select(prediction);
    }, 50);
  }, [annotationAtom]);

  return (
    <Elem name="section">
      {hasInterface('annotations:view-all')  && (
        <Tooltip title="View all annotations">
          <Button
            icon={<IconViewAll />}
            type="text"
            aria-label="View All"
            onClick={() => onToggleVisibility()}
            primary={ viewingAll }
            style={{
              height: 36,
              width: 36,
              padding: 0,
            }}
          />
        </Tooltip>
      )}

      {!viewingAll && hasInterface('ground-truth') && <GroundTruth annotationAtom={annotationAtom}/>}

      {/* {!isPrediction && !viewingAll && hasInterface('edit-history') && <EditingHistory annotationAtom={annotationAtom} />} */}

      {!viewingAll && hasInterface('annotations:delete') && (
        <Tooltip title="Delete annotation">
          <Button
            icon={<LsTrash />}
            look="danger"
            type="text"
            aria-label="Delete"
            onClick={() => {
              confirm({
                title: 'Delete annotation',
                body: 'This action cannot be undone',
                buttonLook: 'destructive',
                okText: 'Proceed',
                onOk: () => {
                  annotationsController.delete(annotationAtom);
                },
              });
            }}
            style={{
              height: 36,
              width: 36,
              padding: 0,
            }}
          />
        </Tooltip>
      )}

      <CopyAnnotation
        visible={!viewingAll && hasInterface('annotations:add-new') && saved}
        entityType={entity.type}
        onCopyAnnotation={onCopyAnnotation}
      />

      <Button
        icon={<LsSettings/>}
        type="text"
        aria-label="Settings"
        primary={settingsVisible}
        onClick={() => toggleSettings()}
        style={{
          height: 36,
          width: 36,
          padding: 0,
        }}
      />

      <InstructionsButton
        enabled={!!instructions && hasInterface('instruction')}
        instructionsVisible={instructionsVisible}
        toggleInstructionsVisibility={() => {
          setInstructionsVisibility(!instructionsVisible);
        }}
      />
    </Elem>
  );
};

