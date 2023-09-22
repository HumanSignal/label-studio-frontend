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

const convert = (items: TaxonomyItem[], options: TaxonomyOptions): AntTaxonomyItem[] => {
  const enrich = (item: TaxonomyItem) => {
    // @todo marginLeft: -4 is good to align labels, but cuts them in selected list
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

  return items.map(item => ({
    title: enrich(item),
    value: item.path.join(options.pathSeparator),
    key: item.path.join(options.pathSeparator),
    isLeaf: item.isLeaf !== false && !item.children,
    disableCheckbox: options.leafsOnly && (item.isLeaf === false || !!item.children),
    children: item.children ? convert(item.children, options) : undefined,
  }));
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
  const value = selected.map(path => path.join(separator)).map(path => ({ title: path, value: path, id: path }));
  const dropdownWidth = options.dropdownWidth === undefined ? true : +options.dropdownWidth;

  useEffect(() => {
    setTreeData(convert(items, options));
  }, [items]);

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
