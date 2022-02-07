import chroma from "chroma-js";
import { observer } from "mobx-react";
import Tree from 'rc-tree';
import { createContext, FC, useCallback, useContext, useMemo, useState } from "react";
import { IconLockLocked, IconLockUnlocked, LsSparks } from "../../../assets/icons";
import { IconChevronLeft, IconEyeClosed, IconEyeOpened } from "../../../assets/icons/timeline";
import { IconArrow } from "../../../assets/icons/tree";
import { Button, ButtonProps } from "../../../common/Button/Button";
import Registry from "../../../core/Registry";
import { PER_REGION_MODES } from "../../../mixins/PerRegionModes";
import { Block, CN, cn, Elem } from "../../../utils/bem";
import { flatten, isDefined, isMacOS } from "../../../utils/utilities";
import { NodeIcon } from "../../Node/Node";
import "./TreeView.styl";

interface OutlinerContextProps {
  regions: any;
}

const OutlinerContext = createContext<OutlinerContextProps>({
  regions: null,
});

interface OutlinerTreeProps {
  regions: any;
  selectedKeys: string[];
}

const OutlinerTreeComponent: FC<OutlinerTreeProps> = ({
  regions,
  selectedKeys,
}) => {
  const rootClass = cn('tree');
  const [hovered, setHovered] = useState<string | null>(null);
  const onHover = (hovered: boolean, id: string) => setHovered(hovered ? id : null);

  const eventHandlers = useEventHandlers({ regions, onHover });
  const regionsTree = useDataTree({ regions, hovered, rootClass, selectedKeys });

  return (
    <OutlinerContext.Provider value={{ regions }}>
      <Block name="outliner-tree">
        <Tree
          draggable={regions.group === 'manual'}
          multiple
          defaultExpandAll
          defaultExpandParent
          autoExpandParent
          checkable={false}
          prefixCls="lsf-tree"
          className={rootClass.toClassName()}
          treeData={regionsTree}
          selectedKeys={selectedKeys}
          icon={({ item, isArea }: any) => isArea ? <NodeIconComponent node={item}/> : false}
          switcherIcon={({ isLeaf }: any) => <SwitcherIcon isLeaf={isLeaf}/>}
          {...eventHandlers}
        />
      </Block>
    </OutlinerContext.Provider>
  );
};

const useDataTree = ({
  regions,
  hovered,
  rootClass,
  selectedKeys,
}: any) => {
  const processor = useCallback((item: any, idx) => {
    const { id, type, hidden } = item;
    const style = item.background ?? item.getOneColor();
    const color = chroma(style).alpha(1);
    const mods: Record<string, any> = { hidden, type };
    const label = type.match('label')
      ? item.value
      : (item?.labels ?? []).join(", ") || "No label";

    return {
      idx,
      key: id,
      type,
      label,
      hidden,
      entity: item,
      hovered: id === hovered,
      selected: selectedKeys.includes(id),
      color: color.css(),
      style: {
        '--icon-color': color.css(),
        '--text-color': color.css(),
        '--selection-color': color.alpha(0.1).css(),
      },
      className: rootClass.elem('node').mod(mods).toClassName(),
      title: (data: any) => <RootTitle {...data}/>,
    };
  }, [hovered]);

  return regions.asTree(processor);
};

const useEventHandlers = ({
  regions,
  onHover,
}: {
  regions: any,
  onHover: (hovered: boolean, id: string) => void,
}) => {
  const onSelect = useCallback((_, evt) => {
    const multi = evt.nativeEvent.ctrlKey || (isMacOS() && evt.nativeEvent.metaKey);
    const { node, selected } = evt;

    if (!node.type.match('region')) return;

    if (!multi) regions.selection.clear();

    if (selected) regions.selection.select(node.item);
    else regions.selection.unselect(node.item);
  }, []);

  const onMouseEnter = useCallback(({ node }: any) => {
    onHover(true, node.key);
    node.item?.setHighlight(true);
  }, []);

  const onMouseLeave = useCallback(({ node }: any) => {
    onHover(false, node.key);
    node.item?.setHighlight(false);
  }, []);


  // find the height of the tree formed by dragReg for
  // example if we have a tree of A -> B -> C -> D and
  // we're moving B -> C part somewhere then it'd have a
  // height of 1
  const treeHeight = useCallback((node: any): number => {
    if (!node) return 0;

    // TODO this can blow up if we have lots of stuff there
    const nodes: any[] = regions.filterByParentID(node.pid);
    const childrenHeight = nodes.map(c => treeHeight(c));

    if (!childrenHeight.length) return 0;

    return 1 + Math.max(...childrenHeight);
  }, []);

  const onDrop = useCallback(({ node, dragNode, dropPosition, dropToGap }) => {
    if (node.classification) return false;
    const dropKey = node.props.eventKey;
    const dragKey = dragNode.props.eventKey;
    const dropPos = node.props.pos.split("-");

    dropPosition = dropPosition - parseInt(dropPos[dropPos.length - 1]);
    const treeDepth = dropPos.length;

    const dragReg = regions.findRegionID(dragKey);
    const dropReg = regions.findRegionID(dropKey);

    regions.unhighlightAll();

    if (treeDepth === 2 && dropToGap && dropPosition === -1) {
      dragReg.setParentID("");
    } else if (dropPosition !== -1) {
      // check if the dragReg can be a child of dropReg
      const selDrop: any[] = dropReg.labeling?.selectedLabels || [];
      const labelWithConstraint = selDrop.filter(l => l.groupcancontain);

      if (labelWithConstraint.length) {
        const selDrag: any[] = dragReg.labeling.selectedLabels;

        const set1 = flatten(labelWithConstraint.map(l => l.groupcancontain.split(",")));
        const set2 = flatten(selDrag.map(l => (l.alias ? [l.alias, l.value] : [l.value])));

        if (set1.filter(value => -1 !== set2.indexOf(value)).length === 0) return;
      }

      // check drop regions tree depth
      if (dropReg.labeling?.from_name?.groupdepth) {
        let maxDepth = Number(dropReg.labeling.from_name.groupdepth);

        if (maxDepth >= 0) {
          maxDepth = maxDepth - treeHeight(dragReg);
          let reg = dropReg;

          while (reg) {
            reg = regions.findRegion(reg.parentID);
            maxDepth = maxDepth - 1;
          }

          if (maxDepth < 0) return;
        }
      }

      dragReg.setParentID(dropReg.id);
    }
  }, []);

  return {
    onSelect,
    onMouseEnter,
    onMouseLeave,
    onDrop,
  };
};

const SwitcherIcon: FC<any> = observer(({ isLeaf }) => {
  return isLeaf ? null : <IconArrow/>;
});

const NodeIconComponent: FC<any> = observer(({ node }) => {
  return node ? <NodeIcon node={node}/> : null;
});

const RootTitle: FC<any> = observer(({
  item,
  hovered,
  label,
  isArea,
  ...props
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const controls = useMemo(() => {
    if (!isArea) return [];
    return item.perRegionDescControls ?? [];
  }, [item?.perRegionDescControls, isArea]);

  const hasControls = useMemo(() => {
    return controls.length > 0;
  }, [controls.length]);

  const toggleCollapsed = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsed(!collapsed);
  }, [collapsed]);

  return (
    <Block name="outliner-item">
      <Elem name="content">
        <Elem name="title">{label}</Elem>
        <RegionControls
          hovered={hovered}
          item={item}
          entity={props.entity}
          regions={props.children}
          type={props.type}
          collapsed={collapsed}
          hasControls={hasControls && isArea}
          toggleCollapsed={toggleCollapsed}
        />
      </Elem>
      {(hasControls && isArea) && (
        <Elem name="ocr">
          <RegionItemDesc
            item={item}
            controls={controls}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            selected={props.selected}
          />
        </Elem>
      )}
    </Block>
  );
});

interface RegionControlsProps {
  item: any;
  entity?: any;
  type: string;
  hovered: boolean;
  hasControls: boolean;
  collapsed: boolean;
  regions?: Record<string, any>;
  toggleCollapsed: (e: any) => void;
}

const RegionControls: FC<RegionControlsProps> = observer(({
  hovered,
  item,
  entity,
  collapsed,
  regions,
  hasControls,
  type,
  toggleCollapsed,
}) => {
  const { regions: regionStore } = useContext(OutlinerContext);

  const hidden = useMemo(() => {
    if (type.match('region')) {
      return entity.hidden;
    } else if(type.match('label') && regions) {
      return Object
        .values(regions)
        .reduce((acc, { hidden }) => acc && hidden, true);
    }
    return false;
  }, [entity, type, regions]);

  const onToggleHidden = useCallback(() => {
    if (type.match('region')) {
      entity.toggleHidden();
    } else if(type.match('label')) {
      regionStore.setHiddenByLabel(!hidden, entity);
    }
  }, [item, item?.toggleHidden, hidden]);

  return (
    <Elem name="controls" mod={{ withControls: hasControls }}>
      <Elem name="control" mod={{ type: "score" }}>
        {isDefined(item?.score) && item.score.toFixed(2)}
      </Elem>
      <Elem name="control" mod={{ type: "dirty" }}>
        {/* dirtyness is not implemented yet */}
      </Elem>
      <Elem name="control" mod={{ type: "predict" }}>
        {item?.origin === 'prediction' && (
          <LsSparks style={{ width: 18, height: 18 }}/>
        )}
      </Elem>
      <Elem name="control" mod={{ type: "lock" }}>
        {/* TODO: implement manual region locking */}
        {item && (hovered || !item.editable) && (
          <RegionControlButton disabled={item.readonly} onClick={() => item.setLocked(!item.locked)}>
            {item.editable ? <IconLockUnlocked/> : <IconLockLocked/>}
          </RegionControlButton>
        )}
      </Elem>
      <Elem name="control" mod={{ type: "visibility" }}>
        {(hovered || hidden) && (
          <RegionControlButton onClick={onToggleHidden}>
            {hidden ? <IconEyeClosed/> : <IconEyeOpened/>}
          </RegionControlButton>
        )}
      </Elem>
      {hasControls && (
        <Elem name="control" mod={{ type: "visibility" }}>
          <RegionControlButton onClick={toggleCollapsed}>
            <IconChevronLeft
              style={{
                transform: `rotate(${collapsed ? -90 : 90}deg)`,
              }}
            />
          </RegionControlButton>
        </Elem>
      )}
    </Elem>
  );
});

const RegionControlButton: FC<ButtonProps> = ({ children, onClick, ...props }) => {
  return (
    <Button
      {...props}
      onClick={(e) => {
        e.stopPropagation(),
        onClick?.(e);
      }}
      type="text"
      style={{ padding: 0, width: 24, height: 24 }}
    >
      {children}
    </Button>
  );
};

interface RegionItemOCSProps {
  item: any;
  collapsed: boolean;
  controls: any[];
  selected: boolean;
  setCollapsed: (value: boolean) => void;
}

const RegionItemDesc: FC<RegionItemOCSProps> = observer(({
  item,
  collapsed,
  setCollapsed,
  selected,
}) => {
  const controls: any[] = item.perRegionDescControls || [];

  const onClick = useCallback((e) => {
    e.stopPropagation();

    if (!selected) {
      item.annotation.selectArea(item);
    }
  }, [item, selected, collapsed]);

  return (
    <Block
      name="ocr"
      mod={{ collapsed, empty: !(controls?.length > 0)  }}
      onClick={onClick}
      onDragStart={(e: any) => e.stopPropagation()}
    >
      <Elem name="controls">
        {controls.map((tag, idx) => {
          const View = Registry.getPerRegionView(tag.type, PER_REGION_MODES.REGION_LIST);

          return View ? (
            <View
              key={idx}
              item={tag}
              area={item}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              color={chroma(item.getOneColor()).alpha(0.2).css()}
              outliner
            />
          ): null;
        })}
      </Elem>
    </Block>
  );
});


export const OutlinerTree = observer(OutlinerTreeComponent);
