import { Block, Elem } from '../../utils/bem';
import { Dropdown } from '../../common/Dropdown/Dropdown';

import { FC, useCallback, useMemo, useState } from 'react';
import { Button } from '../../common/Button/Button';
import { IconFilter } from '../../assets/icons';

import './Filter.styl';
import { FilterInterface, FilterListInterface } from './FilterInterfaces';
import { FilterRow } from './FilterRow';

export const Filter: FC<FilterInterface> = ({
  availableFilters,
  // filterData,
  // filteringPath,
  // onChange,
}) => {
  const [filterList, setFilterList] = useState<FilterListInterface[]>([]);

  const addNewFilterListItem = useCallback(() => {
    const _oldFilterList = [...filterList];

    _oldFilterList.push({
      field: availableFilters[0].label,
      operation: '',
      value: '',
    });

    setFilterList(_oldFilterList);
  }, [setFilterList, filterList]);

  const onChangeRow = useCallback((index: number, obj: any) => {
    const _oldFilterList = [...filterList];

    _oldFilterList[index] = { ..._oldFilterList[index], ...obj };
    setFilterList(_oldFilterList);
  }, [filterList]);

  const onDeleteRow = (index: number) => {
    const _oldFilterList = [...filterList];

    _oldFilterList.splice(index, 1);

    setFilterList(_oldFilterList);
  };

  const renderFilterList = useMemo(() => {
    return filterList.map((filter: FilterListInterface, index) => {
      return (
        <Block key={index} name={'filter-item'}>
          <FilterRow
            index={index}
            availableFilters={availableFilters}
            field={filter.field}
            operation={filter.operation}
            value={filter.value}
            onDelete={onDeleteRow}
            onChange={onChangeRow}
          />
        </Block>
      );
    });
  }, [filterList, onChangeRow, onDeleteRow]);

  const renderFilter = useMemo(() => {
    return (
      <Block name={'filter'}>
        {filterList.length > 0 ? renderFilterList : <Elem name="empty">No filters applied</Elem>}
        <Button
          look="alt"
          size="small"
          type={'text'}
          onClick={addNewFilterListItem}
        >
          Add {filterList.length ? 'Another Filter' : 'Filter'}
        </Button>
      </Block>
    );
  }, [filterList, renderFilterList, addNewFilterListItem]);

  return (
    <Dropdown.Trigger
      content={renderFilter}
    >
      <Button type="text" style={{ padding: 0, whiteSpace: 'nowrap' }}>
        <Elem name={'icon'}>
          <IconFilter />
        </Elem>
        <Elem name={'text'}>Filter</Elem>
      </Button>
    </Dropdown.Trigger>
  );
};
