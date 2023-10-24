import React, { ChangeEvent, KeyboardEvent, ReactNode, useCallback } from 'react';

import './TaxonomySearch.styl';
import { Block } from '../../utils/bem';
import { AntTaxonomyItem } from './NewTaxonomy';
import { debounce } from 'lodash';

type TaxonomySearchProps = {
  treeData: AntTaxonomyItem[],
  origin: ReactNode,
  onChange: (list: AntTaxonomyItem[], expandedKeys: string[] | undefined) => void,
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
    const _expandedKeys: string[] = [];

    if (!searchValue) {
      return {
        filteredDataTree:treeData,
      };
    }

    const dig = (list: AntTaxonomyItem[], keepAll = false) => {
      return list.reduce<AntTaxonomyItem[]>((total, dataNode) => {
        const children = dataNode['children'];

        const match = keepAll || filterTreeNode(searchValue, dataNode);
        const childList = dig(children || [], match);

        if (match || childList.length) {
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
      filteredDataTree:dig(treeData),
      expandedKeys:_expandedKeys,
    };
  }, []);

  const handleSearch = useCallback(debounce(async (e: ChangeEvent<HTMLInputElement>) => {
    const _filteredData = filterTreeData(treeData, e.target.value);

    onChange(_filteredData.filteredDataTree, _filteredData.expandedKeys);
  }, 300), [treeData]);

  return(
    <>
      <Block
        tag={'input'}
        onChange={handleSearch}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.stopPropagation()}
        placeholder={'Search'}
        data-testid={'taxonomy-search'}
        name={'taxonomy-search-input'}
      />
      {origin}
    </>
  );
};

export { TaxonomySearch };
