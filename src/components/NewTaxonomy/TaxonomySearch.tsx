import React, { ChangeEvent, KeyboardEvent, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import './TaxonomySearch.styl';
import { Block } from '../../utils/bem';
import { AntTaxonomyItem } from './NewTaxonomy';
import { debounce } from 'lodash';

type TaxonomySearchProps = {
  treeData: AntTaxonomyItem[],
  onChange: (list: AntTaxonomyItem[], expandedKeys: React.Key[] | null) => void,
}

export type TaxonomySearchRef = {
  changeValue: () => void,
  focus: () => void,
}

const TaxonomySearch = React.forwardRef<TaxonomySearchRef, TaxonomySearchProps>(({
  treeData,
  onChange,
}, ref) => {
  useImperativeHandle(ref, (): TaxonomySearchRef => {
    return {
      changeValue() {
        setInputValue('');
        onChange(treeData, []);
      },
      focus() {
        return inputRef.current?.focus();
      },
    };
  });

  const inputRef = useRef<HTMLInputElement>();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const _filteredData = filterTreeData(treeData, inputValue);

    onChange(_filteredData.filteredDataTree, null);
  }, [treeData]);

  // When the treeData is being loaded as async API call, the _treeNode.title_ is not a string but an object, so we have to treat this value to get the title from props.children
  const getTitle = useCallback((treeNodeTitle: any): string => {
    if (!treeNodeTitle.props) return treeNodeTitle;

    // The title can be on the first level of props.children, but it may be on the second level or deeper
    // This recursive function validate where the title is and return to the filterTreeNode
    if (typeof treeNodeTitle.props.children === 'object')
      return getTitle(treeNodeTitle.props.children);

    return treeNodeTitle.props.children;
  }, []);

  //To filter the treeData items that match with the searchValue
  const filterTreeNode = useCallback((searchValue: string, treeNode: AntTaxonomyItem) => {
    const lowerSearchValue = String(searchValue).toLowerCase();
    const lowerResultValue = getTitle(treeNode.title);

    if (!lowerSearchValue) {
      return false;
    }

    return String(lowerResultValue).toLowerCase().includes(lowerSearchValue);
  }, []);

  // It's running recursively through treeData and its children filtering the content that match with the search value
  const filterTreeData = useCallback((treeData: AntTaxonomyItem[], searchValue: string) => {
    const _expandedKeys: React.Key[] = [];

    if (!searchValue) {
      return {
        filteredDataTree: treeData,
        expandedKeys: _expandedKeys,
      };
    }

    const dig = (list: AntTaxonomyItem[], keepAll = false) => {
      return list.reduce<AntTaxonomyItem[]>((total, dataNode) => {
        const children = dataNode['children'];

        const match = keepAll || filterTreeNode(searchValue, dataNode);
        const childList = dig(children || [], match);

        if (match || childList.length) {
          if (!keepAll)
            _expandedKeys.push(dataNode.key);

          total.push({
            ...dataNode,
            isLeaf: undefined,
            children: childList,
          });
        }

        return total;
      }, []);
    };

    return {
      filteredDataTree: dig(treeData),
      expandedKeys: _expandedKeys,
    };
  }, []);

  const handleSearch = useCallback(debounce(async (e: ChangeEvent<HTMLInputElement>) => {
    const _filteredData = filterTreeData(treeData, e.target.value);

    onChange(_filteredData.filteredDataTree, _filteredData.expandedKeys);
  }, 300), [treeData]);

  return (
    <Block
      ref={inputRef}
      value={inputValue}
      tag={'input'}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        handleSearch(e);
      }}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' || e.key === 'Delete') e.stopPropagation();
      }}
      placeholder={'Search'}
      data-testid={'taxonomy-search'}
      name={'taxonomy-search-input'}
    />
  );
});

export { TaxonomySearch };
