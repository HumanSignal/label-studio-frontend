import { FC, useEffect, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as FilterInputs from './types';

import { Block, Elem } from '../../utils/bem';
import { FilterDropdown } from './FilterDropdown';

import './FilterRow.styl';
import { FilterListInterface } from './FilterInterfaces';
import { isDefined } from '../../utils/utilities';
import { IconDelete } from '../../assets/icons';

interface FilterRowInterface extends FilterListInterface {
  availableFilters: any;
  index: number;
  onChange: (index: number, obj: any) => void;
  onDelete: (index: number) => void;
}

export const FilterRow: FC<FilterRowInterface> = ({
  field,
  operation,
  value,
  availableFilters,
  index,
  onChange,
  onDelete,
}) => {
  const [_selectedField, setSelectedField] = useState(0);
  const [_selectedOperation, setSelectedOperation] = useState(-1);
  const [_inputComponent, setInputComponent] = useState(null);

  useEffect(() => {
    onChange(index, { field:availableFilters[_selectedField].label, path: availableFilters[_selectedField].path, operation:'', value:'' });
  }, [_selectedField]);

  useEffect(() => {
    if(!isDefined(_selectedOperation) || _selectedOperation < 0) return;
    const _filterInputs = FilterInputs?.[availableFilters[_selectedField].type][_selectedOperation];

    onChange(index, { operation: _filterInputs?.key });
    setInputComponent(_filterInputs?.input);
  }, [_selectedOperation, _selectedField]);

  return (
    <Block name={'filter-row'}>
      <Elem name={'column'}>
        Where
      </Elem>
      <Elem name={'column'}>
        <FilterDropdown
          value={field}
          items={availableFilters}
          style={{ width: '140px' }}
          onChange={(value: any) => {
            setSelectedField(value);
          }}
        />
      </Elem>
      <Elem name={'column'}>
        <FilterDropdown
          value={operation}
          items={FilterInputs?.[availableFilters[_selectedField].type]}
          style={{ width: '110px' }}
          onChange={(value: any) => {
            setSelectedOperation(value);
          }}
        />
      </Elem>
      <Elem name={'column'}>
        {(_inputComponent && operation !== 'empty') && (
          <Elem
            tag={_inputComponent}
            value={value}
            onChange={(value: any) => {
              onChange(index, { value });
            }}
          />
        )}
      </Elem>
      <Elem name={'column'}>
        <Elem
          onClick={() => {
            onDelete(index);
          }}
          name={'delete'}>
          <IconDelete />
        </Elem>
      </Elem>
    </Block>
  );
};
