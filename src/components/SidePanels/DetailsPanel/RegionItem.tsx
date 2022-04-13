import chroma from "chroma-js";
import { observer } from "mobx-react";
import { FC, useMemo, useState } from "react";
import { IconLink, IconLockLocked, IconLockUnlocked, IconPlusAlt, IconTrash } from "../../../assets/icons";
import { IconEyeClosed, IconEyeOpened } from "../../../assets/icons/timeline";
import { Button, ButtonProps } from "../../../common/Button/Button";
import { Block, Elem } from "../../../utils/bem";
import { NodeIcon } from "../../Node/Node";

interface RegionItemProps {
  region: any;
  withActions?: boolean;
  compact?: boolean;
  withIds?: boolean;
  mainDetails?: FC<{region: any}>;
  metaDetails?: FC<{region: any, editMode?: boolean, cancelEditMode?: () => void}>;
}

export const RegionItem: FC<RegionItemProps> = observer(({
  region,
  compact = false,
  withActions = true,
  withIds = true,
  mainDetails: MainDetails,
  metaDetails: MetaDetails,
}) => {
  const { annotation } = region;
  const { selectedRegions: nodes } = annotation;
  const [editMode, setEditMode] = useState(false);

  const hasEditableRegions = useMemo(() => {
    return !!nodes.find((node: any) => node.editable && !node.classification);
  }, [nodes]);

  const title = useMemo(() => {
    return region.labels.join(", ") || "No label";
  }, [region.labels]);

  const color = useMemo(() => {
    const bgColor = region.background ?? region.getOneColor() ?? "#666";

    return chroma(bgColor).alpha(1);
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
      {MainDetails && <Elem name="content"><MainDetails region={region}/></Elem>}
      {withActions && (
        <RegionAction
          region={region}
          editMode={editMode}
          annotation={annotation}
          hasEditableRegions={hasEditableRegions}
          onEditModeChange={setEditMode}
        />
      )}
      {MetaDetails && (
        <Elem name="content">
          <MetaDetails
            region={region}
            editMode={editMode}
            cancelEditMode={() => setEditMode(false)}
          />
        </Elem>
      )}
    </Block>
  );
});

const RegionAction: FC<any> = observer(({
  region,
  annotation,
  editMode,
  hasEditableRegions,
  onEditModeChange,
}) => {
  const entityButtons: JSX.Element[] = [];

  if (hasEditableRegions) {
    entityButtons.push((
      <RegionActionButton
        key="relation"
        icon={<IconLink/>}
        primary={annotation.relationMode}
        onClick={() => {
          if (annotation.relationMode) {
            annotation.stopRelationMode();
          } else {
            annotation.startRelationMode(region);
          }
        }}
        hotkey="region:relation"
      />
    ));

    entityButtons.push((
      <RegionActionButton
        key="meta"
        icon={<IconPlusAlt/>}
        primary={editMode}
        onClick={() => onEditModeChange(!editMode)}
        hotkey="region:meta"
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
          icon={region.editable ? <IconLockUnlocked/> : <IconLockLocked/>}
          disabled={region.readonly}
          onClick={() => region.setLocked(!region.locked)}
          hotkey="region:lock"
        />
        <RegionActionButton
          icon={region.hidden ? <IconEyeClosed/> : <IconEyeOpened/>}
          onClick={region.toggleHidden}
          hotkey="region:visibility"
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
