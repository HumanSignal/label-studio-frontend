import { inject, observer } from "mobx-react";
import { FC } from "react";
import { Elem } from "../../../utils/bem";
import { Comments } from "../../Comments/Comments";
import { AnnotationHistory } from "../../CurrentEntity/AnnotationHistory";
import { PanelBase, PanelProps } from "../PanelBase";
import "./DetailsPanel.styl";
import { RegionDetailsMain, RegionDetailsMeta } from "./RegionDetails";
import { RegionItem } from "./RegionItem";
import { Relations } from "./Relations";
interface DetailsPanelProps extends PanelProps {
  regions: any;
  selection: any;
}

const DetailsPanelComponent: FC<DetailsPanelProps> = ({ currentEntity, regions, ...props }) => {
  const selectedRegions = regions.selection;

  return (
    <PanelBase {...props} currentEntity={currentEntity} name="details" title="Details">
      <Content selection={selectedRegions} currentEntity={currentEntity} />
    </PanelBase>
  );
};

const Content: FC<any> = observer(({
  selection,
  currentEntity,
}) => {
  return (
    <>
      {selection.size ? (
        <RegionsPanel regions={selection}/>
      ) : (
        <GeneralPanel currentEntity={currentEntity}/>
      )}
    </>
  );
});

const GeneralPanel: FC<any> = inject("store")(observer(({ store, currentEntity }) => {
  const { relationStore } = currentEntity;

  return (
    <>
      <Elem name="section">
        <Elem name="section-head">
          Annotation History
          <span>#{currentEntity.pk ?? currentEntity.id}</span>
        </Elem>
        <Elem name="section-content">
          <AnnotationHistory inline />
        </Elem>
      </Elem>
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

GeneralPanel.displayName = "GeneralPanel";

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
