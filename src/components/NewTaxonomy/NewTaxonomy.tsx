import { TreeSelect } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

import { Tooltip } from '../../common/Tooltip/Tooltip';

import './NewTaxonomy.styl';

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
  color?: string,
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

type SelectedItem = {
  label: string,
  value: string,
}[];

type TaxonomyProps = {
  items: TaxonomyItem[],
  selected: SelectedItem[],
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
  // generate string or component to be the `title` of the item
  const enrich = (item: TaxonomyItem) => {
    const color = (item: TaxonomyItem) => (
      // no BEM here to make it more lightweight
      // global classname to allow to change it in Style tag
      <span className="htx-taxonomy-item-color" style={{ background: item.color }}>
        {item.label}
      </span>
    );

    if (!item.hint) return item.color ? color(item) : item.label;

    return (
      <Tooltip title={item.hint} mouseEnterDelay={500}>
        {item.color ? color(item) : <span>{item.label}</span>}
      </Tooltip>
    );
  };

  const convertItem = (item: TaxonomyItem): AntTaxonomyItem => {
    const value = item.path.join(options.pathSeparator);
    const disabledNode = options.leafsOnly && (item.isLeaf === false || !!item.children);
    const maxUsagesReached = options.maxUsagesReached && !selectedPaths.includes(value);

    return {
      title: enrich(item),
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
  const value = selected.map(path => path.map(p => p.value).join(separator));
  const displayed = selected.map(path => ({
    value: path.map(p => p.value).join(separator),
    label: options.showFullPath ? path.map(p => p.label).join(separator) : path.at(-1).label,
  }));

  useEffect(() => {
    setTreeData(convert(items, { ...options, maxUsagesReached }, value));
  }, [items, maxUsagesReached]);

  const loadData = useCallback(async (node: any) => {
    return onLoadData?.(node.value.split(separator));
  }, []);

  return (
    <TreeSelect
      treeData={treeData}
      value={displayed}
      labelInValue={true}
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
