import chroma from "chroma-js";
import { observer } from "mobx-react";
import { FC, useMemo, useState } from "react";
import { IconLink, IconPlusAlt, IconTrash } from "../../../assets/icons";
import { IconEyeClosed, IconEyeOpened } from "../../../assets/icons/timeline";
import { Button, ButtonProps } from "../../../common/Button/Button";
import { Block, Elem } from "../../../utils/bem";
import { NodeIcon } from "../../Node/Node";

interface RegionItemProps {
  region: any;
  withActions?: boolean;
  compact?: boolean;
  withIds?: boolean;
}

export const RegionItem: FC<RegionItemProps> = observer(({
  region,
  compact = false,
  withActions = true,
  withIds = true,
}) => {
  const { annotation } = region;
  const { selectedRegions: nodes, selectionSize } = annotation;
  const [editMode, setEditMode] = useState(false);

  const hasEditableNodes = useMemo(() => {
    return !!nodes.find((node: any) => node.editable);
  }, [nodes]);

  const hasEditableRegions = useMemo(() => {
    return !!nodes.find((node: any) => node.editable && !node.classification);
  }, [nodes]);

  const title = useMemo(() => {
    return region.labels.join(", ") || "No label";
  }, [region.labels]);

  const color = useMemo(() => {
    return chroma(region.getOneColor()).alpha(1);
  }, [region]);

  return (
    <Block name="detailed-region" mod={{ compact }}>
      <Elem name="head" style={{ color: color.css() }}>
        <Elem name="title">
          <Elem name="icon"><NodeIcon node={region}/></Elem>
          {title}
        </Elem>
        {withIds && <span>{region.cleanId}</span>}
      </Elem>
      {withActions && (
        <RegionAction
          region={region}
          annotation={annotation}
          hasEditableRegions={hasEditableRegions}
        />
      )}
    </Block>
  );
});

const RegionAction: FC<any> = observer(({
  region,
  annotation,
  hasEditableRegions,
}) => {
  const entityButtons: JSX.Element[] = [];

  if (hasEditableRegions) {
    entityButtons.push((
      <RegionActionButton
        key="relation"
        icon={<IconLink/>}
        onClick={() => annotation.startRelationMode(region)}
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
          icon={region.hidden ? <IconEyeClosed/> : <IconEyeOpened/>}
          onClick={region.toggleHidden}
        />
        <RegionActionButton
          danger
          icon={<IconTrash/>}
          onClick={() => annotation.deleteRegion(region)}
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
