import React, { ChangeEvent, KeyboardEvent, ReactNode, useCallback } from 'react';

import './TaxonomySearch.styl';
import { Block } from '../../utils/bem';
import { AntTaxonomyItem } from './NewTaxonomy';
import { debounce } from 'lodash';

type TaxonomySearchProps = {
  treeData: AntTaxonomyItem[],
  origin: ReactNode,
  onChange: (list: AntTaxonomyItem[], expandedKeys: string[]) => void,
}

const TaxonomySearch = ({
  origin,
  treeData,
  onChange,
}: TaxonomySearchProps) => {

  //To filter the treeData items that match with the searchValue
  const filterTreeNode = useCallback((searchValue: string, treeNode: AntTaxonomyItem) => {
    const lowerSearchValue = String(searchValue).toLowerCase();

    if (!lowerSearchValue) {
      return false;
    }

    return String(treeNode['title']).toLowerCase().includes(lowerSearchValue);
  }, []);

  // It's running recursively through treeData and its children filtering the content that match with the search value
  const filterTreeData = useCallback((treeData: AntTaxonomyItem[], searchValue: string) => {
    if (!searchValue) {
      return treeData;
    }

    const dig = (list: AntTaxonomyItem[], keepAll = false) => {
      return list.reduce<AntTaxonomyItem[]>((total, dataNode) => {
        const children = dataNode['children'];

        const match = keepAll || filterTreeNode(searchValue, dataNode);
        const childList = dig(children || [], match);

        if (match || childList.length) {
          total.push({
            ...dataNode,
            isLeaf: undefined,
            children: childList,
          });
        }
        return total;
      }, []);
    };

    return dig(treeData);
  }, []);

  // After filter the treeData result, this method is used to check which keys must be expanded
  const findExpandedKeys = useCallback((data: AntTaxonomyItem[]) => {
    const _result: string[] = [];

    const expandedKeys = (list: AntTaxonomyItem[]) => {
      list.forEach((item: AntTaxonomyItem) => {
        _result.push(item.key);

        if(item.children?.length) {
          expandedKeys(item.children);
        }
      });
    };

    expandedKeys(data);

    return _result;
  }, []);

  const handleSearch = useCallback(debounce(async (e: ChangeEvent<HTMLInputElement>) => {
    const _filteredData = filterTreeData(treeData, e.target.value);
    let _expandedKeys: string[] = [];


    if (e.target.value !== '')
      _expandedKeys = findExpandedKeys(_filteredData);

    onChange(_filteredData, _expandedKeys);
  }, 300), [treeData]);

  return(
    <>
      <Block
        tag={'input'}
        onChange={handleSearch}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.stopPropagation()}
        placeholder={'Search'}
        name={'taxonomy-search-input'}
      />
      {origin}
    </>
  );
};

export { TaxonomySearch };
