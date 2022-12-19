import { ViewingAllAtom } from '@atoms/Models/AnnotationsAtom/AnnotationsAtom';
import { useSelectedAnnotation } from '@atoms/Models/AnnotationsAtom/Hooks';
import { useInterfaces } from '@atoms/Models/RootAtom/Hooks';
import { useAtomValue } from 'jotai';
import { Block, Elem } from '../../utils/bem';
import { DynamicPreannotationsToggle } from '../AnnotationTab/DynamicPreannotationsToggle';
import { Actions } from './Actions';
import { AnnotationsList } from './Annotations';
import { Controls } from './Controls';
import { CurrentTask } from './CurrentTask';
import './TopBar.styl';

export const TopBar = () => {
  const entity = useSelectedAnnotation();
  const viewingAll = useAtomValue(ViewingAllAtom);
  const hasInterface = useInterfaces();
  const isPrediction = entity?.type === 'prediction';

  return (
    <Block name="topbar">
      <Elem name="group">
        <CurrentTask/>
        {!viewingAll && <AnnotationsList/>}
        <Actions/>
      </Elem>
      <Elem name="group">
        {!viewingAll && (
          <Elem name="section">
            <DynamicPreannotationsToggle />
          </Elem>
        )}
        {!viewingAll && hasInterface('controls') && (hasInterface('review') || !isPrediction) && (
          <Elem name="section" mod={{ flat: true }} style={{ width: 320, boxSizing: 'border-box' }}>
            <Controls annotation={entity} />
          </Elem>
        )}
      </Elem>
    </Block>
  );
};
