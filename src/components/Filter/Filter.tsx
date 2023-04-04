import { Block, Elem } from '../../utils/bem';
import { Dropdown } from '../../common/Dropdown/Dropdown';

import { FC, useCallback, useMemo, useState } from 'react';
import { Button } from '../../common/Button/Button';
import { IconFilter } from '../../assets/icons';

import './Filter.styl';
import { FilterInterface, FilterListInterface } from './FilterInterfaces';
import { FilterRow } from './FilterRow';
import { FilterItems } from './filter-util';

export const Filter: FC<FilterInterface> = ({
  availableFilters,
  filterData,
  // onChange,
}) => {
  const [filterList, setFilterList] = useState<FilterListInterface[]>([]);

  const addNewFilterListItem = useCallback(() => {
    setFilterList((filterList) => [
      ...filterList,
      {
        field: availableFilters[0]?.label ?? '',
        operation: '',
        value: '',
        path: '',
      },
    ]);
  }, [setFilterList, availableFilters]);

  const onChangeRow = useCallback(
    (index: number, { field, operation, value, path }: Partial<FilterListInterface>) => {
      setFilterList((oldList) => {
        const newList = [...oldList];

        newList[index] = {
          ...newList[index],
          field: field ?? newList[index].field,
          operation: operation ?? newList[index].operation,
          value: value ?? newList[index].value,
          path: path ?? newList[index].path,
        };

        FilterItems(filterData, newList[index]);

        return newList;
      });
    },
    [setFilterList, filterData],
  );

  const onDeleteRow = useCallback((index: number) => {
    setFilterList((oldList) => {
      const newList = [...oldList];

      newList.splice(index, 1);
      return newList;
    });
  }, [setFilterList]);

  const renderFilterList = useMemo(() => {
    return filterList.map(({ field, operation, value }, index) => (
      <Block key={index} name="filter-item">
        <FilterRow
          index={index}
          availableFilters={availableFilters}
          field={field}
          operation={operation}
          value={value}
          onDelete={onDeleteRow}
          onChange={onChangeRow}
        />
      </Block>
    ));
  }, [filterList, availableFilters, onDeleteRow, onChangeRow]);

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
