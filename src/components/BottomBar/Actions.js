import { IconCopy, IconInfo, LsSettings } from '../../assets/icons';
import { Button } from '../../common/Button/Button';
import { Tooltip } from '../../common/Tooltip/Tooltip';
import { Elem } from '../../utils/bem';
import { EditingHistory } from './HistoryActions';

export const Actions = ({ store }) => {
  const annotationStore = store.annotationStore;
  const entity = annotationStore.selected;
  const saved = !entity.userGenerate || entity.sentUserGenerate;
  const isPrediction = entity?.type === 'prediction';
  const isViewAll = annotationStore.viewingAll;

  return (
    <Elem name="section">
      {!isPrediction && !isViewAll && store.hasInterface('edit-history') && <EditingHistory entity={entity} />}

      {!isViewAll && store.hasInterface('annotations:add-new') && saved && (
        <Tooltip title={`Create copy of current ${entity.type}`}>
          <Button
            icon={<IconCopy style={{ width: 36, height: 36 }}/>}
            size="small"
            look="ghost"
            type="text"
            aria-label="Copy Annotation"
            onClick={(ev) => {
              ev.preventDefault();

              const cs = store.annotationStore;
              const c = cs.addAnnotationFromPrediction(entity);

              // this is here because otherwise React doesn't re-render the change in the tree
              window.setTimeout(function() {
                store.annotationStore.selectAnnotation(c.id);
              }, 50);
            }}
            style={{
              height: 36,
              width: 36,
              padding: 0,
            }}
          />
        </Tooltip>
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

      {store.description && store.hasInterface('instruction') && (
        <Button
          icon={<IconInfo style={{ width: 16, height: 16 }}/>}
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
    </Elem>
  );
};


