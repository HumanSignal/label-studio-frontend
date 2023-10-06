import { TreeSelect } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

import { Tooltip } from '../../common/Tooltip/Tooltip';

type TaxonomyPath = string[];
type onAddLabelCallback = (path: string[]) => any;
type onDeleteLabelCallback = (path: string[]) => any;

type TaxonomyItem = {
  label: string,
  path: TaxonomyPath,
  depth: number,
  isLeaf?: boolean, // only in new async taxonomy
  children?: TaxonomyItem[],
  origin?: 'config' | 'user' | 'session',
  hint?: string,
};

type AntTaxonomyItem = {
  title: string | JSX.Element,
  value: string,
  key: string,
  isLeaf?: boolean,
  children?: AntTaxonomyItem[],
  disableCheckbox?: boolean,
};

type TaxonomyOptions = {
  leafsOnly?: boolean,
  showFullPath?: boolean,
  pathSeparator: string,
  maxUsages?: number,
  maxWidth?: number,
  minWidth?: number,
  dropdownWidth?: number,
  placeholder?: string,
};

type TaxonomyProps = {
  items: TaxonomyItem[],
  selected: TaxonomyPath[],
  onChange: (node: any, selected: TaxonomyPath[]) => any,
  onLoadData?: (item: TaxonomyPath) => any,
  onAddLabel?: onAddLabelCallback,
  onDeleteLabel?: onDeleteLabelCallback,
  options: TaxonomyOptions,
  isEditable?: boolean,
};

type TaxonomyExtendedOptions = TaxonomyOptions & {
  maxUsagesReached?: boolean,
};

const convert = (
  items: TaxonomyItem[],
  options: TaxonomyExtendedOptions,
  selectedPaths: string[],
): AntTaxonomyItem[] => {
  const convertItem = (item: TaxonomyItem): AntTaxonomyItem => {
    const value = item.path.join(options.pathSeparator);
    const disabledNode = options.leafsOnly && (item.isLeaf === false || !!item.children);
    const maxUsagesReached = options.maxUsagesReached && !selectedPaths.includes(value);

    return {
      title: item.hint ? (
        <Tooltip title={item.hint} mouseEnterDelay={500}>
          <span>{item.label}</span>
        </Tooltip>
      ) : item.label,
      value,
      key: value,
      isLeaf: item.isLeaf !== false && !item.children,
      disableCheckbox: disabledNode || maxUsagesReached,
      children: item.children?.map(convertItem),
    };
  };

  return items.map(convertItem);
};

const NewTaxonomy = ({
  items,
  selected,
  onChange,
  onLoadData,
  // @todo implement user labels
  // onAddLabel,
  // onDeleteLabel,
  options,
  // @todo implement readonly mode
  // isEditable = true,
}: TaxonomyProps) => {
  const [treeData, setTreeData] = useState<AntTaxonomyItem[]>([]);
  const separator = options.pathSeparator;
  const style = { minWidth: options.minWidth ?? 200, maxWidth: options.maxWidth };
  const dropdownWidth = options.dropdownWidth === undefined ? true : +options.dropdownWidth;
  const maxUsagesReached = !!options.maxUsages && selected.length >= options.maxUsages;
  const value = selected.map(path => path.join(separator));

  useEffect(() => {
    setTreeData(convert(items, { ...options, maxUsagesReached }, value));
  }, [items, maxUsagesReached]);

  const loadData = useCallback(async (node: any) => {
    return onLoadData?.(node.value.split(separator));
  }, []);

  return (
    <TreeSelect
      treeData={treeData}
      value={value}
      onChange={items => onChange(null, items.map(item => item.value.split(separator)))}
      loadData={loadData}
      treeCheckable
      treeCheckStrictly
      showCheckedStrategy={TreeSelect.SHOW_ALL}
      treeExpandAction="click"
      dropdownMatchSelectWidth={dropdownWidth}
      placeholder={options.placeholder || 'Click to add...'}
      style={style}
      className="htx-taxonomy"
    />
  );
};

export { NewTaxonomy };
