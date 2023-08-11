import { TreeSelect } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

type TaxonomyPath = string[];
type onAddLabelCallback = (path: string[]) => any;
type onDeleteLabelCallback = (path: string[]) => any;

type TaxonomyItem = {
  label: string,
  path: TaxonomyPath,
  depth: number,
  children?: TaxonomyItem[],
  origin?: 'config' | 'user' | 'session',
  hint?: string,
};

type AntTaxonomyItem = {
  title: string,
  value: string,
  key: string,
  children?: AntTaxonomyItem[],
};

type TaxonomyOptions = {
  leafsOnly?: boolean,
  showFullPath?: boolean,
  pathSeparator: string,
  maxUsages?: number,
  maxWidth?: number,
  minWidth?: number,
  placeholder?: string,
};

type TaxonomyProps = {
  items: TaxonomyItem[],
  selected: TaxonomyPath[],
  onChange: (node: any, selected: TaxonomyPath[]) => any,
  onLoadData?: (item: TaxonomyPath) => any,
  onAddLabel?: onAddLabelCallback,
  onDeleteLabel?: onDeleteLabelCallback,
  options?: TaxonomyOptions,
  isEditable?: boolean,
};

const convert = (items: TaxonomyItem[], separator: string): AntTaxonomyItem[] => {
  return items.map(item => ({
    title: item.label,
    value: item.path.join(separator),
    key: item.path.join(separator),
    // disableCheckbox: !!item.children,
    isLeaf: item.isLeaf !== false && !item.children,
    // checkable: !item.children,
    // selectable: !item.children,
    children: item.children ? convert(item.children, separator) : undefined,
  }));
};

const NewTaxonomy = ({
  items,
  selected,
  onChange,
  onLoadData,
  onAddLabel,
  onDeleteLabel,
  options = {},
  isEditable = true,
}: TaxonomyProps) => {
  const [treeData, setTreeData] = useState<AntTaxonomyItem[]>([]);
  const separator = options.pathSeparator;

  useEffect(() => {
    setTreeData(convert(items, separator));
  }, [items]);

  const loadData = useCallback(async (node: any) => {
    return onLoadData?.(node.value.split(separator));
  }, []);

  return (
    <div>
      <TreeSelect
        treeData={treeData}
        value={selected.map(path => path.join(separator))}
        onChange={items => onChange(null, items.map(item => item.value.split(separator)))}
        loadData={loadData}
        // onChange={console.log}
        treeCheckable
        treeCheckStrictly
        showCheckedStrategy={TreeSelect.SHOW_ALL}
        treeExpandAction="click"
        placeholder="Please select"
        style={{ width: '100%', minWidth: 300 }}
      />
    </div>
  );
};

export { NewTaxonomy };
