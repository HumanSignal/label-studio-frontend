import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { useRegionOrder } from '@atoms/Models/RegionsAtom/Hooks/useRegionOrder';
import { useRegions } from '@atoms/Models/RegionsAtom/Hooks/useRegions';
import { useRegionsController } from '@atoms/Models/RegionsAtom/Hooks/useRegionsController';
import { RegionsController } from '@atoms/Models/RegionsAtom/RegionsController';
import { Region } from '@atoms/Models/RegionsAtom/Types';
import { PrimitiveAtom } from 'jotai';
import { FC } from 'react';
import { useSDK } from 'src/App';
import { InternalSDK } from 'src/core/SDK/Internal/Internal.sdk';
import { FF_DEV_2755, isFF } from 'src/utils/feature-flags';
import { RegionController } from '../../../../Regions/RegionController';

type Processor = (
  result: Region,
  idx: number,
  controller?: RegionController,
) => RegionTreeItem;

type TreeOptions = {
  regions: PrimitiveAtom<Region>[],
  sdk: InternalSDK,
  controller: RegionsController,
  processor: Processor,
}

export type RegionTreeItem = {
  id: string,
  hotkey: string,
  isGroup: boolean,
  isNotLabel: boolean,
  idx: number,
  key: string,
  type: string,
  label: string,
  hidden: boolean,
  entity: Region,
  hovered: boolean,
  selected: boolean,
  position: string,
  parentID: string | null,
  color: string,
  style: React.CSSProperties,
  className: string,
  isRegion: boolean,
  title: JSX.Element | FC<any>,
  children: RegionTreeItem[],
  controller: RegionController,
}

type ExtendedRegionTree<P extends {}> = Omit<RegionTreeItem, 'children'> & {
  children: ExtendedRegionTree<P>[],
} & P;

export const useRegionsTree = (
  annotationAtom: AnnotationAtom,
  processor: Processor,
): RegionTreeItem[] => {
  const sdk = useSDK();
  let result: RegionTreeItem[] = [];
  const regions = useRegions(annotationAtom);
  const controller = useRegionsController(annotationAtom);
  const { group = 'manual' } = useRegionOrder(annotationAtom);

  const options = {
    regions,
    sdk,
    controller,
    processor,
  };

  switch (group) {
    case 'manual':
      result = asTree(options);
      break;
    case 'label':
      result = asLabelsTree(options);
      break;
    case 'type':
      result = asTypeTree(options);
      break;
    default:
      console.warn(`Unknown group type: ${group}`);
      break;
  }

  return result ?? [];
};

const asTree = ({
  regions,
  sdk,
  processor,
  controller,
}: TreeOptions) => {
  const tree: RegionTreeItem[] = [];
  const lookup = new Map<string, RegionTreeItem>();

  // every region has a parentID
  // parentID is an empty string - "" if it's top level
  // or it can contain a string key to the parent region
  // [ { id: "1", parentID: "" }, { id: "2", parentID: "1" } ]
  // would create a tree of two elements
  regions.forEach((el, idx) => {
    const regionController = controller.getController(el)!;
    const entity = sdk.get(el);
    const result = processor(entity, idx, regionController) as RegionTreeItem;

    result.entity = entity;
    result.parentID = regionController.parentID ?? null;
    result.children = [];
    result.isRegion = true;
    result.controller = regionController;

    lookup.set(entity.id, result);
  });

  lookup.forEach((el => {
    const pid = el.parentID;
    const parent = pid ? (lookup.get(pid) ?? lookup.get(pid.replace(/#(.+)/i, ''))) : null;

    if (parent) return parent.children.push(el);

    tree.push(el);
  }));

  return tree;
};

const asLabelsTree = ({
  regions,
  sdk,
  processor,
  // controller,
}: TreeOptions) => {
  type GroupTree = ExtendedRegionTree<{
    id: string,
    isArea: boolean,
    hotkey: string,
    isGroup: boolean,
    isNotLabel: boolean,
  }>
  // collect all label states into two maps
  const groups: Record<string, RegionTreeItem> = {};
  const result: RegionTreeItem[] = [];
  // const onClick = createClickRegionInTreeHandler(result);

  let index = 0;

  const getLabelGroup = (label: GroupTree, key: string) => {
    const labelGroup = groups[key];

    if (labelGroup) return labelGroup;

    return groups[key] = {
      ...processor(label, index),
      id: key,
      isGroup: true,
      isNotLabel: true,
      children: [] as RegionTreeItem[],
    };
  };

  const getRegionLabel = (region: Region) => {
    return region.labeling?.selectedLabels
      || region.emptyLabel && [region.emptyLabel];
  };

  const addToLabelGroup = (
    key: string,
    label,
    region: PrimitiveAtom<Region>,
  ) => {
    const group = getLabelGroup(label, key);
    const groupId = group.id;
    const entity = sdk.get(region);
    const labelHotKey = getRegionLabel(entity)?.[0]?.hotkey;

    if (isFF(FF_DEV_2755)) {
      group.hotkey = labelHotKey;
      group.position = groupId.slice(0, groupId.indexOf('#'));
    }

    const regionTree = processor(entity, index);

    group.children.push({
      ...regionTree,
      entity,
      isRegion: true,
    });
  };

  const addRegionsToLabelGroup = (
    labels: string[],
    region: PrimitiveAtom<Region>,
  ) => {
    if (labels) {
      for (const label of labels) {
        addToLabelGroup(`${label.value}#${label.id}`, label, region);
      }
    } else {
      addToLabelGroup('no-label', undefined, region);
    }
  };

  for (const region of regions) {
    addRegionsToLabelGroup(region.labeling?.selectedLabels, region);

    index++;
  }

  const groupsArray = Object.values(groups);

  if (isFF(FF_DEV_2755)) {
    groupsArray.sort((a, b) => a.hotkey > b.hotkey ? 1 : a.hotkey < b.hotkey ? -1 : 0);
  }

  result.push(
    ...groupsArray,
  );

  return result;
};

const asTypeTree = ({
  regions,
  // sdk,
  processor,
  // controller,
}: TreeOptions) => {
  console.log(regions, processor);
  return [];
};
