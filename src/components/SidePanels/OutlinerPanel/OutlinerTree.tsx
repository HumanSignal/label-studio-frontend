import { atomWithStoredList } from '@atoms/Custom/atomWithStoredList';
import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { RegionTreeItem, useRegionsTree } from '@atoms/Models/RegionsAtom/Hooks/useRegionsTree';
import { Region, RegionOrder } from '@atoms/Models/RegionsAtom/Types';
import chroma from 'chroma-js';
import { atom, PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import Tree, { TreeProps } from 'rc-tree';
import { EventDataNode } from 'rc-tree/lib/interface';
import { createContext, FC, MouseEvent, useCallback, useContext, useMemo, useState } from 'react';
import { IconLockLocked, IconLockUnlocked, IconWarning, LsSparks } from '../../../assets/icons';
import { IconChevronLeft, IconEyeClosed, IconEyeOpened } from '../../../assets/icons/timeline';
import { IconArrow } from '../../../assets/icons/tree';
import { Button, ButtonProps } from '../../../common/Button/Button';
import { Tooltip } from '../../../common/Tooltip/Tooltip';
import Registry from '../../../core/Registry';
import { PER_REGION_MODES } from '../../../mixins/PerRegionModes';
import { Block, CN, cn, Elem } from '../../../utils/bem';
import { FF_DEV_2755, isFF } from '../../../utils/feature-flags';
import { flatten, isDefined, isMacOS } from '../../../utils/utilities';
import './TreeView.styl';

const localStoreName = 'collapsed-label-pos';

interface OutlinerContextProps {
  regions: any;
}

const OutlinerContext = createContext<OutlinerContextProps>({
  regions: null,
});

type ReverseExtract<T, U> = T extends U ? never : T;

type DragOptions = ReverseExtract<TreeProps<any>['onDrop'], undefined>;

type ExtendDataNode<T> = T extends EventDataNode ? EventDataNode & {
  classification: boolean,
  props: RegionTreeItem,
} : T;

type DragHandler = DragOptions extends (info: infer T) => void ? ((info: T & {
  [key in keyof T]: ExtendDataNode<T[key]>;
}) => void) | undefined : never;

interface OutlinerTreeProps {
  regions: PrimitiveAtom<Region>[];
  group: RegionOrder['group'];
  selectedKeys: string[];
  annotationAtom: AnnotationAtom;
}

const hoveredAtom = atom<string | null>(null);
const collapsedItemsAtom = atomWithStoredList(localStoreName, []);

export const OutlinerTree: FC<OutlinerTreeProps> = ({
  regions,
  group,
  selectedKeys,
  annotationAtom,
}) => {
  const rootClass = cn('tree');
  const setHovered = useSetAtom(hoveredAtom);
  const onHover = useCallback((hovered: boolean, id: string) => setHovered(hovered ? id : null), []);

  const regionsTree = useDataTree({ annotationAtom, rootClass, selectedKeys });
  const eventHandlers = useEventHandlers({ regions, regionsTree, onHover });

  return (
    <OutlinerContext.Provider value={{ regions }}>
      <Block name="outliner-tree">
        <Tree
          draggable={group === 'manual'}
          multiple
          defaultExpandAll
          defaultExpandParent
          autoExpandParent
          checkable={false}
          prefixCls="lsf-tree"
          className={rootClass.toClassName()}
          treeData={regionsTree}
          selectedKeys={selectedKeys}
          // icon={({ entity }: any) => <NodeIcon node={entity}/>}
          switcherIcon={({ isLeaf }: any) => isLeaf ? null : <IconArrow/>}
          {...eventHandlers}
        />
      </Block>
    </OutlinerContext.Provider>
  );
};

const useDataTree = ({
  annotationAtom,
  rootClass,
  selectedKeys,
}: {
  annotationAtom: AnnotationAtom,
  rootClass: CN,
  selectedKeys: string[],
}) => {
  const tree = useRegionsTree(annotationAtom, (
    item,
    index,
    controller,
  ) => {
    const {
      type = undefined,
      hidden = false,
      isDrawing = false,
      singleResult,
      oneColor,
    } = controller ?? {};

    const { id } = item ?? {};
    const style = singleResult?.backgroundColor ?? oneColor;
    const color = chroma(style ?? '#666').alpha(1);
    const mods: Record<string, any> = { hidden, type, isDrawing };

    const label = (() => {
      if (!type) {
        return 'No Label';
      } else if (controller) {
        return (controller.selectedLabels ?? []).join(', ') || 'No label';
      } else if (/labels|tool/.test(type)) {
        return item.value;
      }
    })();

    console.log('render');

    return {
      ...item,
      idx: index,
      key: id,
      type,
      label,
      hidden,
      entity: item,
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
  });

  return tree;
};

const useEventHandlers = ({
  regions,
  regionsTree,
  onHover,
}: {
  regions: PrimitiveAtom<Region>[],
  regionsTree: RegionTreeItem[],
  onHover: (hovered: boolean, id: string) => void,
}) => {
  const onSelect = useCallback((_, evt) => {
    const multi = evt.nativeEvent.ctrlKey || (isMacOS() && evt.nativeEvent.metaKey);
    const { node } = evt;

    const self = node?.item;

    if (!self?.annotation) return;

    const annotation = self.annotation;

    if (multi) {
      annotation.toggleRegionSelection(self);
      return;
    }

    const wasNotSelected = !self.selected;

    if (wasNotSelected) {
      annotation.selectArea(self);
    } else {
      annotation.unselectAll();
    }
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

  const onDrop = useCallback<DragHandler>(({
    node,
    dragNode,
    dropPosition,
    dropToGap,
  }) => {
    if (node.classification) return false;
    const dropKey = node.key;
    const dragKey = dragNode.key;
    const dropPos = node.pos.split('-');

    dropPosition = dropPosition - parseInt(dropPos[dropPos.length - 1]);
    const treeDepth = dropPos.length;

    const dragReg = regions.findRegionID(dragKey);
    const dropReg = regions.findRegionID(dropKey);

    regions.unhighlightAll();

    if (treeDepth === 2 && dropToGap && dropPosition === -1) {
      dragReg.setParentID('');
    } else if (dropPosition !== -1) {
      // check if the dragReg can be a child of dropReg
      const selDrop: any[] = dropReg.labeling?.selectedLabels || [];
      const labelWithConstraint = selDrop.filter(l => l.groupcancontain);

      if (labelWithConstraint.length) {
        const selDrag: any[] = dragReg.labeling.selectedLabels;

        const set1 = flatten(labelWithConstraint.map(l => l.groupcancontain.split(',')));
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

  const onExpand = useCollapseEventHandler(regionsTree);

  return {
    onSelect,
    onMouseEnter,
    onMouseLeave,
    onDrop,
    ...onExpand,
  };
};

const useCollapseEventHandler = (regionsTree: RegionTreeItem[]) => {
  const [collapsedPos, setCollapsedPos] = useAtom(collapsedItemsAtom);

  const collapse = (pos: string) => {
    const newCollapsedPos = [...collapsedPos, pos];

    setCollapsedPos(newCollapsedPos);
  };

  const expand = (pos: string) => {
    const newCollapsedPos = collapsedPos.filter(cPos => cPos !== pos);

    setCollapsedPos(newCollapsedPos);
  };

  const onExpand = useCallback((_, { node }) => {
    const region = regionsTree.find((region: any) => region.key === node.key);

    if (!region) return;

    const pos = region.position;

    collapsedPos.includes(pos)
      ? expand(pos)
      : collapse(pos);
  }, []);

  const expandedKeys = regionsTree
    .filter((item) => !collapsedPos.includes(item.position))
    .map((item) => item.key) ?? [];

  return isFF(FF_DEV_2755) ? {
    onExpand,
    expandedKeys,
    defaultExpandAll: true,
    defaultExpandParent: false,
  } : {};
};

const RootTitle: FC<RegionTreeItem> = ({
  entity,
  label,
  isRegion,
  ...props
}) => {
  const hovered = useAtomValue(hoveredAtom);

  const [collapsed, setCollapsed] = useState(false);

  const controls = useMemo(() => {
    if (!isRegion) return [];
    return entity.perRegionDescControls ?? [];
  }, [entity?.perRegionDescControls, isRegion]);

  const hasControls = useMemo(() => {
    return controls.length > 0;
  }, [controls.length]);

  const toggleCollapsed = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsed(!collapsed);
  }, [collapsed]);

  return (
    <Block name="outliner-item">
      <Elem name="content">
        {!props.isGroup && <Elem name="index">{props.idx + 1}</Elem>}
        <Elem name="title">
          {label}
          {entity?.isDrawing && (
            <Elem tag="span" name="incomplete">
              <Tooltip title="Incomplete polygon">
                <IconWarning />
              </Tooltip>
            </Elem>
          )}
        </Elem>
        <RegionControls
          hovered={hovered === props.id}
          item={entity}
          entity={entity}
          regions={props.children}
          type={props.type}
          collapsed={collapsed}
          hasControls={hasControls && isRegion}
          toggleCollapsed={toggleCollapsed}
        />
      </Elem>
      {(hasControls && isRegion) && (
        <Elem name="ocr">
          <RegionItemDesc
            item={entity}
            controls={controls}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            selected={props.selected}
          />
        </Elem>
      )}
    </Block>
  );
};

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

const RegionControls: FC<RegionControlsProps> = ({
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
    if (type?.includes('region') || type?.includes('range')) {
      return entity.hidden;
    } else if ((!type || type.includes('label')) && regions) {
      return Object.values(regions).every(({ hidden }) => hidden);
    }
    return false;
  }, [entity, type, regions]);

  const onToggleHidden = useCallback(() => {
    if (type?.includes('region') || type?.includes('range')) {
      entity.toggleHidden();
    } else if (!type || type.includes('label')) {
      regionStore.setHiddenByLabel(!hidden, entity);
    }
  }, [item, item?.toggleHidden, hidden]);

  const onToggleCollapsed = useCallback((e: MouseEvent) => {
    toggleCollapsed(e);
  }, [toggleCollapsed]);

  const onToggleLocked = useCallback(() => {
    item.setLocked((locked: boolean) => !locked);
  }, []);

  return (
    <Elem name="controls" mod={{ withControls: hasControls }}>
      <Elem name="control" mod={{ type: 'score' }}>
        {isDefined(item?.score) && item.score.toFixed(2)}
      </Elem>
      <Elem name="control" mod={{ type: 'dirty' }}>
        {/* dirtyness is not implemented yet */}
      </Elem>
      <Elem name="control" mod={{ type: 'predict' }}>
        {item?.origin === 'prediction' && (
          <LsSparks style={{ width: 18, height: 18 }}/>
        )}
      </Elem>
      <Elem name="control" mod={{ type: 'lock' }}>
        {/* TODO: implement manual region locking */}
        {item && (hovered || !item.editable) && (
          <RegionControlButton disabled={item.readonly} onClick={onToggleLocked}>
            {item.editable ? <IconLockUnlocked/> : <IconLockLocked/>}
          </RegionControlButton>
        )}
      </Elem>
      <Elem name="control" mod={{ type: 'visibility' }}>
        {(hovered || hidden) && (
          <RegionControlButton onClick={onToggleHidden}>
            {hidden ? <IconEyeClosed/> : <IconEyeOpened/>}
          </RegionControlButton>
        )}
      </Elem>
      {hasControls && (
        <Elem name="control" mod={{ type: 'visibility' }}>
          <RegionControlButton onClick={onToggleCollapsed}>
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
};

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

const RegionItemDesc: FC<RegionItemOCSProps> = ({
  item,
  collapsed,
  setCollapsed,
  selected,
}) => {
  const controls: any[] = item.perRegionDescControls || [];

  const onClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();

    if (!selected) {
      item.annotation.selectArea(item);
    }
  }, [item, selected, collapsed]);

  return (
    <Block
      name="ocr"
      mod={{ collapsed, empty: !(controls?.length > 0) }}
      onClick={onClick}
      onDragStart={(e: any) => e.stopPropagation()}
    >
      <Elem name="controls">
        {controls.map((tag, idx) => {
          const View = Registry.getPerRegionView(tag.type, PER_REGION_MODES.REGION_LIST);
          const color = item.getOneColor();
          const css = color ? chroma(color).alpha(0.2).css() : undefined;

          return View ? (
            <View
              key={idx}
              item={tag}
              area={item}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              color={css}
              outliner
            />
          ) : null;
        })}
      </Elem>
    </Block>
  );
};
