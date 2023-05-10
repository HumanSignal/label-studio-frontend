import { Block, Elem } from '../../utils/bem';
import { Dropdown } from '../../common/Dropdown/Dropdown';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../common/Button/Button';
import { IconFilter } from '../../assets/icons';

import './Filter.styl';
import { FilterInterface, FilterListInterface } from './FilterInterfaces';
import { FilterRow } from './FilterRow';
import { FilterItems } from './filter-util';

export const Filter: FC<FilterInterface> = ({
  availableFilters,
  filterData,
  onChange,
  animated = true,
}) => {
  const [filterList, setFilterList] = useState<FilterListInterface[]>([]);

  useEffect(() => {
    if(filterList.length > 0) {
      onChange(FilterItems(filterData, filterList));
    }
  }, [filterData]);

  const addNewFilterListItem = useCallback(() => {
    setFilterList((filterList) => [
      ...filterList,
      {
        field: availableFilters[0]?.label ?? '',
        logic: 'and',
        operation: '',
        value: '',
        path: '',
      },
    ]);
  }, [setFilterList, availableFilters]);

  const onChangeRow = useCallback(
    (index: number, { field, operation, value, path, logic }: Partial<FilterListInterface>) => {
      setFilterList((oldList) => {
        const newList = [...oldList];

        newList[index] = {
          ...newList[index],
          field: field ?? newList[index].field,
          operation: operation ?? newList[index].operation,
          logic: logic ?? newList[index].logic,
          value: value ?? newList[index].value,
          path: path ?? newList[index].path,
        };

        onChange(FilterItems(filterData, newList));

        return newList;
      });
    },
    [setFilterList, filterData],
  );

  const onDeleteRow = useCallback((index: number) => {
    setFilterList((oldList) => {
      const newList = [...oldList];

      newList.splice(index, 1);

      onChange(FilterItems(filterData, newList));

      return newList;
    });
  }, [setFilterList, filterData]);

  const renderFilterList = useMemo(() => {
    return filterList.map(({ field, operation, logic, value }, index) => (
      <Block key={index} name="filter-item">
        <FilterRow
          index={index}
          availableFilters={availableFilters}
          field={field}
          logic={logic}
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
      dataTestId={'dropdown'}
      animated={animated}
    >
      <Button data-cy={'filter-button'} type="text" style={{ padding: 0, whiteSpace: 'nowrap' }}>
        <Elem name={'icon'}>
          <IconFilter />
        </Elem>
        <Elem name={'text'}>Filter</Elem>
        {filterList.length > 0 && <Elem name={'filter-length'} data-testid={'filter-length'}>{filterList.length}</Elem>}
      </Button>
    </Dropdown.Trigger>
  );
};
