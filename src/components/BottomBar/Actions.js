import { IconInfoOutline, LsSettings } from '../../assets/icons';
import { Button } from '../../common/Button/Button';
import { Elem } from '../../utils/bem';
import { EditingHistory } from './HistoryActions';
import { DynamicPreannotationsToggle } from '../AnnotationTab/DynamicPreannotationsToggle';

export const Actions = ({ store }) => {
  const annotationStore = store.annotationStore;
  const entity = annotationStore.selected;
  const isPrediction = entity?.type === 'prediction';
  const isViewAll = annotationStore.viewingAll === true;

  return (
    <Elem name="section">
      {!isPrediction && !isViewAll && store.hasInterface('edit-history') && <EditingHistory entity={entity} />}

      {store.description && store.hasInterface('instruction') && (
        <Button
          icon={<IconInfoOutline style={{ width: 20, height: 20 }}/>}
          primary={store.showingDescription}
          type="text"
          aria-label="Instructions"
          onClick={() => store.toggleDescription()}
          style={{
            height: 36,
            width: 36,
            padding: 0,
          }}
        />
      )}

      <Button
        icon={<LsSettings/>}
        type="text"
        aria-label="Settings"
        onClick={() => store.toggleSettings()}
        style={{
          height: 36,
          width: 36,
          padding: 0,
        }}
      />

      {!isViewAll && (

        <Elem name="section">
          <DynamicPreannotationsToggle />
        </Elem>
      )}
    </Elem>
  );
};


