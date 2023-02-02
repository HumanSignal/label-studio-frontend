import { Annotation } from 'src/Engine/Atoms/Models/AnnotationsAtom/Types';
// import { useInterfaces } from '@atoms/Models/RootAtom/Hooks';
import { Atom, PrimitiveAtom } from 'jotai';
import { FC } from 'react';
import { Elem } from '../../../utils/bem';
// import { FF_DEV_2290, isFF } from '../../../utils/feature-flags';
import { Region } from '@atoms/Models/RegionsAtom/Types';
import { PanelBase, PanelProps } from '../PanelBase';
import './DetailsPanel.styl';
import { RegionDetailsMain, RegionDetailsMeta } from './RegionDetails';
import { RegionItem } from './RegionItem';

const DetailsPanelComponent: FC<PanelProps> = (props) => {
  return (
    <PanelBase {...props} name="details" title="Details">
      <Content selection={props.selection} currentEntity={props.annotationAtom} />
    </PanelBase>
  );
};

type ContentProps = {
  selection: PrimitiveAtom<Region>[],
  currentEntity: Atom<Annotation>,
}

const Content: FC<ContentProps> = ({
  selection,
  currentEntity,
}) => {
  return (
    <>
      {(selection.length) ? (
        <RegionsPanel regions={selection}/>
      ) : (
        <GeneralPanel currentEntity={currentEntity}/>
      )}
    </>
  );
};

const GeneralPanel: FC<any> = ({ currentEntity: _ }) => {
  // const hasInterface = useInterfaces();
  // const { relationStore } = currentEntity;
  // const showAnnotationHistory = hasInterface('annotations:history');
  // const showDraftInHistory = isFF(FF_DEV_2290);

  return (
    <>
      {/* {!showDraftInHistory ? (
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
      )} */}
      {/* TODO: implement relations */}
      <Elem name="section">
        {/* <Elem name="section-head">
          Relations ({relationStore.size})
        </Elem>
        <Elem name="section-content">
          <Relations
            relationStore={relationStore}
          />
        </Elem> */}
      </Elem>
      {/* {hasInterface('annotations:comments') && store.commentStore.isCommentable && (
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
      )} */}
    </>
  );
};

GeneralPanel.displayName = 'GeneralPanel';

const RegionsPanel: FC<{regions: any}> = ({
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
};

const SelectedRegion: FC<{region: any}> = ({
  region,
}) => {
  return (
    <RegionItem
      region={region}
      mainDetails={RegionDetailsMain}
      metaDetails={RegionDetailsMeta}
    />
  );
};

export const DetailsPanel = DetailsPanelComponent;
