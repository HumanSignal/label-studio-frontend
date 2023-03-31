import React from 'react';
import { FilterDropdown } from '../FilterDropdown';
import { observer } from 'mobx-react';


const BaseInput = observer((props) => (
  <FilterDropdown
    onChange={(value) => {
      props.onChange(value);
    }}
    items={[
      { label: 'yes' },
      { label: 'no' },
    ]}
  />
));

export const BooleanFilter = [
  {
    key: 'equal',
    label: 'is',
    valueType: 'single',
    input: BaseInput,
  },
];
