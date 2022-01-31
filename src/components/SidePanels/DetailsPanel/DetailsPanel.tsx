import { observer } from "mobx-react";
import { FC, useMemo, useState } from "react";
import { Block, Elem } from "../../../utils/bem";
import { AnnotationHistory } from "../../CurrentEntity/AnnotationHistory";
import { PanelBase, PanelProps } from "../PanelBase";
import { NodeIcon } from "../../Node/Node";
import "./DetailsPanel.styl";
import chroma from "chroma-js";
import { Button, ButtonProps } from "../../../common/Button/Button";
import { IconLink, IconPlusAlt, IconTrash } from "../../../assets/icons";

interface DetailsPanelProps extends PanelProps {
  regions: any;
  selection: any;
}

const DetailsPanelComponent: FC<DetailsPanelProps> = ({ currentEntity, regions, ...props }) => {
  const selectedRegions = regions.selection;

  return (
    <PanelBase {...props} name="details" title="Details">
      <Content selection={selectedRegions} currentEntity={currentEntity} />
    </PanelBase>
  );
};

const Content: FC<any> = observer(({
  selection,
  currentEntity,
}) => {
  console.log({ selection, currentEntity });

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

const GeneralPanel: FC<any> = observer(({ currentEntity }) => {
  return (
    <Elem name="section">
      <Elem name="section-head">
          Annotation History

        <span>#{currentEntity.pk ?? currentEntity.id}</span>
      </Elem>
      <Elem name="section-content">
        <AnnotationHistory inline/>
      </Elem>
    </Elem>
  );
});

const RegionsPanel: FC<{regions:  any}> = observer(({
  regions,
}) => {
  return (
    <div>
      {regions.list.map((reg: any) => {
        return (
          <RegionItem key={reg.id} region={reg}/>
        );
      })}
    </div>
  );
});

const RegionItem: FC<{region: any}> = observer(({ region }) => {
  const { annotation } = region;
  const { highlightedNode: node, selectedRegions: nodes, selectionSize } = annotation;
  const [editMode, setEditMode] = useState(false);

  const hasEditableNodes = useMemo(() => {
    return !!nodes.find(node => node.editable);
  }, [nodes]);

  const hasEditableRegions = useMemo(() => {
    return !!nodes.find(node => node.editable && !node.classification);
  }, [nodes]);

  const title = useMemo(() => {
    return region.labels.join(", ") || "No label";
  }, [region.labels]);

  const color = useMemo(() => {
    return chroma(region.getOneColor()).alpha(1);
  }, [region]);

  return (
    <Block name="detailed-region">
      <Elem name="head" style={{ color: color.css() }}>
        <Elem name="title">
          <Elem name="icon"><NodeIcon node={region}/></Elem>
          {title}
        </Elem>
        <span>{region.cleanId}</span>
      </Elem>
      <RegionAction
        region={region}
        annotation={annotation}
        node={node}
        nodes={nodes}
        hasEditableRegions={hasEditableRegions}
      />
    </Block>
  );
});

const RegionAction: FC<any> = observer(({
  annotation,
  node,
  hasEditableRegions,
}) => {
  const entityButtons: JSX.Element[] = [];

  if (hasEditableRegions) {
    entityButtons.push((
      <RegionActionButton
        key="relation"
        icon={<IconLink/>}
        onClick={() => annotation.startRelationMode(node)}
      />
    ));

    entityButtons.push((
      <RegionActionButton
        key="meta"
        icon={<IconPlusAlt/>}
      />
    ));
  }

  return (
    <Block name="region-actions">
      <Elem name="group" mod={{ align: "left" }}>
        {entityButtons}
      </Elem>
      <Elem name="group" mod={{ align: "right" }}>
        <RegionActionButton
          icon={<IconTrash/>}
          onClick={() => annotation.deleteRegion(node)}
        />
      </Elem>
    </Block>
  );
});

const RegionActionButton: FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <Button {...props} look="alt" style={{ padding: 0 }}>
      {children}
    </Button>
  );
};

export const DetailsPanel = observer(DetailsPanelComponent);
