import { observer } from 'mobx-react';
import { Block, Elem } from '../../utils/bem';
import { Actions } from './Actions';
import { Controls } from './Controls';
import './BottomBar.styl';

export const BottomBar = observer(({ store }) => {
  const annotationStore = store.annotationStore;
  const entity = annotationStore?.selected;
  const isPrediction = entity?.type === 'prediction';

  const isViewAll = annotationStore?.viewingAll === true;

  return store ? (
    <Block name="bottombar">
      <Elem name="group">
        <Actions store={store}/>
      </Elem>
      <Elem name="group">
        {!isViewAll && store.hasInterface('controls') && (store.hasInterface('review') || !isPrediction) && (
          <Elem name="section" mod={{ flat: true }}>
            <Controls annotation={entity} />
          </Elem>
        )}
      </Elem>
    </Block>
  ) : null;
});
