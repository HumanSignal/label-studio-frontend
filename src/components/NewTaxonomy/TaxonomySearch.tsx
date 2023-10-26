import React, {
  ChangeEvent,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';

import './TaxonomySearch.styl';
import { Block } from '../../utils/bem';
import { AntTaxonomyItem } from './NewTaxonomy';
import { debounce } from 'lodash';

type TaxonomySearchProps = {
  treeData: AntTaxonomyItem[],
  origin: ReactNode,
  onChange: (list: AntTaxonomyItem[], expandedKeys: React.Key[]) => void,
}

export type TaxonomySearchRef = {
  changeValue: () => void,
  focus: () => void,
}

const TaxonomySearch = React.forwardRef<TaxonomySearchRef, TaxonomySearchProps>(({
  origin,
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

    onChange(_filteredData.filteredDataTree, _filteredData.expandedKeys);
  }, [treeData]);

  //To filter the treeData items that match with the searchValue
  const filterTreeNode = useCallback((searchValue: string, treeNode: AntTaxonomyItem) => {
    const lowerSearchValue = String(searchValue).toLowerCase();
    const lowerResultValue = typeof treeNode.title === 'object' ? treeNode.title.props.children.props.children : treeNode.title;

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
    <>
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
      {origin}
    </>
  );
});

export { TaxonomySearch };
