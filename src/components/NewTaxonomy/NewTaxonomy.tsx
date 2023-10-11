import { TreeSelect } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

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
  return items.map(item => ({
    title: item.hint ? (
      <Tooltip title={item.hint} mouseEnterDelay={500}>
        <span>{item.label}</span>
      </Tooltip>
    ) : item.label,
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
  const dropdownWidth = options.dropdownWidth === undefined ? true : +options.dropdownWidth;

  useEffect(() => {
    setTreeData(convert(items, options));
  }, [items]);

  const flatten = useMemo(() => {
    const flatten: TaxonomyItem[] = [];
    const visitItem = (item: TaxonomyItem) => {
      flatten.push(item);
      item.children?.forEach(visitItem);
    };

    items.forEach(visitItem);
    return flatten;
  }, [items]);

  const formatOutputValue = useMemo(() => {
    return selected.map(path => {
      const selectedItem = path.map(value => {
        const label = flatten.find(taxonomyItem => taxonomyItem.path.at(-1) === value)?.label;

        return label ?? value;
      });

      return {
        label: options.showFullPath ? selectedItem.join(separator) : selectedItem[path.length - 1],
        value: path.join(separator),
      };
    });
  }, [selected]);

  const loadData = useCallback(async (node: any) => {
    return onLoadData?.(node.value.split(separator));
  }, []);

  return (
    <TreeSelect
      treeData={treeData}
      labelInValue={true}
      value={formatOutputValue}
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
