import { useAtomValue } from 'jotai';
import { FC } from 'react';
import { viewingAllAtom } from 'src/Engine/Atoms/Models/AnnotationsAtom/AnnotationsAtom';
import { useWriteableAnnotation } from 'src/Engine/Atoms/Models/AnnotationsAtom/Hooks/useWritableAnnotation';
import { AnnotationAtom } from 'src/Engine/Atoms/Models/AnnotationsAtom/Types';
import { useInterfaces } from 'src/Engine/Atoms/Models/RootAtom/Hooks';
import { Block, Elem } from '../../utils/bem';
import { Actions } from './Actions/Actions';
import { AnnotationsList } from './Annotations';
import { CurrentTask } from './CurrentTask';
import { SubmissionControls } from './SubmissionControls/SubmissionControls';
import './TopBar.styl';

type TopBarProps = {
  annotationAtom?: AnnotationAtom,
}

export const TopBar: FC<TopBarProps> = ({
  annotationAtom,
}) => {
  const [
    selectedEntityAtom,
    updateSelectedEntityAtom,
    setSelectedEntityAtom,
  ] = useWriteableAnnotation(annotationAtom);

  const selectedEntity = useAtomValue(selectedEntityAtom);
  const viewingAll = useAtomValue(viewingAllAtom);
  const hasInterface = useInterfaces();
  const isPrediction = selectedEntity?.type === 'prediction';

  return (
    <Block name="topbar">
      <Elem name="group">
        <CurrentTask selectedEntityId={selectedEntity?.id}/>
        {!viewingAll && (
          <AnnotationsList
            selectedAnnotation={selectedEntityAtom}
            selectAnnotation={setSelectedEntityAtom}
            updateAnnotation={updateSelectedEntityAtom}
          />
        )}
        <Actions
          annotationAtom={selectedEntityAtom}
        />
      </Elem>
      <Elem name="group">
        {!viewingAll && (
          <Elem name="section">
            {/* <DynamicPreannotationsToggle /> */}
          </Elem>
        )}
        {!viewingAll && hasInterface('controls') && (hasInterface('review') || !isPrediction) && (
          <Elem name="section" mod={{ flat: true }} style={{ width: 320, boxSizing: 'border-box' }}>
            <SubmissionControls
              selectedAnnotationAtom={selectedEntityAtom}
            />
          </Elem>
        )}
      </Elem>
    </Block>
  );
};
