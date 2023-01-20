import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import { useSDK } from 'src/App';
import { FF_DEV_2755, isFF } from 'src/utils/feature-flags';
import { Result } from '../Types';

type Processor = (
  result: Result,
  idx: number,

) => Partial<RegionTree>;

type RegionTree = {
  idx: number,
  key: string,
  type: string,
  label: string,
  hidden: boolean,
  entity: Result,
  hovered: boolean,
  selected: boolean,
  color: string,
  style: React.CSSProperties,
  className: string,
  isRegion: boolean,
  title: JSX.Element | FC<any>,
  children: RegionTree[],
}

export const useRegionsTree = (
  annotationAtom: AnnotationAtom,
  processor: Processor,
): RegionTree[] => {
  const sdk = useSDK();
  const { resultAtom } = sdk.annotations.getResultsAtom(annotationAtom)!;
  const { group, result } = useAtomValue(resultAtom);

  if (group === null || group === 'manual') {
    return asTree(result, processor);
  } else if (group === 'label') {
    return asLabelsTree(result, processor);
  } else if (group === 'type') {
    return asTypeTree(result, processor);
  }

  console.error(`Grouping by ${group} is not implemented`);

  return [];
};

const asTree = (regions: Result[], processor: Processor) => {
  const tree: RegionTree[] = [];
  const lookup = new Map<string, RegionTree>();

  // every region has a parentID
  // parentID is an empty string - "" if it's top level
  // or it can contain a string key to the parent region
  // [ { id: "1", parentID: "" }, { id: "2", parentID: "1" } ]
  // would create a tree of two elements

  regions.forEach((el, idx) => {
    const result = processor(el, idx) as RegionTree;

    result.entity = el;
    result.children = [];
    result.isRegion = true;

    lookup.set(el.id, result);
  });

  lookup.forEach((el => {
    const pid = el.entity.parentID;
    const parent = pid ? (lookup.get(pid) ?? lookup.get(pid.replace(/#(.+)/i, ''))) : null;

    if (parent) return parent.children.push(el);

    tree.push(el);
  }));

  return tree;
};

const asLabelsTree = (regions: Result[], processor: Processor) => {
  // collect all label states into two maps
  const groups = {};
  const result: RegionTree[] = [];
  // const onClick = createClickRegionInTreeHandler(result);

  let index = 0;

  const getLabelGroup = (label, key) => {
    const labelGroup = groups[key];

    if (labelGroup) return labelGroup;

    return groups[key] = {
      ...processor(label, index),
      id: key,
      isGroup: true,
      isNotLabel: true,
      children: [],
    };
  };

  const getRegionLabel = (region) => {
    return region.labeling?.selectedLabels || region.emptyLabel && [region.emptyLabel];
  };

  const addToLabelGroup = (key, label, region) => {
    const group = getLabelGroup(label, key);
    const groupId = group.id;
    const labelHotKey = getRegionLabel(region)?.[0]?.hotkey;

    if (isFF(FF_DEV_2755)) {
      group.hotkey = labelHotKey;
      group.pos = groupId.slice(0, groupId.indexOf('#'));
    }

    group.children.push({
      ...processor(region, index),
      item: region,
      isArea: true,
    });
  };

  const addRegionsToLabelGroup = (labels, region) => {
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

const asTypeTree = (regions: Result[], processor: Processor) => {
  console.log(regions, processor);
  return [];
};
