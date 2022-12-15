import { Annotation, Prediction } from '@atoms/Models/AnnotationsAtom/Types';
import { Regions } from '@atoms/Models/RegionsAtom/Types';
import { Atom } from 'jotai';
import { inject, observer } from 'mobx-react';
import { FC } from 'react';
import { Elem } from '../../../utils/bem';
import { FF_DEV_2290, isFF } from '../../../utils/feature-flags';
import { Comments } from '../../Comments/Comments';
import { AnnotationHistory } from '../../CurrentEntity/AnnotationHistory';
import { DraftPanel } from '../../DraftPanel/DraftPanel';
import { PanelBase, PanelProps } from '../PanelBase';
import './DetailsPanel.styl';
import { RegionDetailsMain, RegionDetailsMeta } from './RegionDetails';
import { RegionItem } from './RegionItem';
import { Relations } from './Relations';

const DetailsPanelComponent: FC<PanelProps> = (props) => {
  return (
    <PanelBase {...props} name="details" title="Details">
      <Content selection={props.selection} currentEntity={props.currentEntity} />
    </PanelBase>
  );
};

type ContentProps = {
  selection: Regions['selection'],
  currentEntity: Atom<Annotation | Prediction>,
}

const Content: FC<ContentProps> = observer(({
  selection,
  currentEntity,
}) => {
  return (
    <>
      {(selection.size) ? (
        <RegionsPanel regions={selection}/>
      ) : (
        <GeneralPanel currentEntity={currentEntity}/>
      )}
    </>
  );
});

const GeneralPanel: FC<any> = inject('store')(observer(({ store, currentEntity }) => {
  const { relationStore } = currentEntity;
  const showAnnotationHistory = store.hasInterface('annotations:history');
  const showDraftInHistory = isFF(FF_DEV_2290);

  return (
    <>
      {!showDraftInHistory ? (
        <DraftPanel item={currentEntity} />
      ) : (
        <Elem name="section">
          <Elem name="section-head">
              Annotation History
            <span>#{currentEntity.pk ?? currentEntity.id}</span>
          </Elem>
          <Elem name="section-content">
            <AnnotationHistory
              inline
              showDraft={showDraftInHistory}
              enabled={showAnnotationHistory}
            />
          </Elem>
        </Elem>
      )}
      <Elem name="section">
        <Elem name="section-head">
          Relations ({relationStore.size})
        </Elem>
        <Elem name="section-content">
          <Relations
            relationStore={relationStore}
          />
        </Elem>
      </Elem>
      {store.hasInterface('annotations:comments') && store.commentStore.isCommentable && (
        <Elem name="section">
          <Elem name="section-head">
            Comments
          </Elem>
          <Elem name="section-content">
            <Comments
              commentStore={store.commentStore}
              cacheKey={`task.${store.task.id}`}
            />
          </Elem>
        </Elem>
      )}
    </>
  );
}));

GeneralPanel.displayName = 'GeneralPanel';

const RegionsPanel: FC<{regions:  any}> = observer(({
  regions,
}) => {
  return (
    <div>
      {regions.list.map((reg: any) => {
        return (
          <SelectedRegion key={reg.id} region={reg}/>
        );
      })}
    </div>
  );
});

const SelectedRegion: FC<{region: any}> = observer(({
  region,
}) => {
  return (
    <RegionItem
      region={region}
      mainDetails={RegionDetailsMain}
      metaDetails={RegionDetailsMeta}
    />
  );
});

export const DetailsPanel = observer(DetailsPanelComponent);
