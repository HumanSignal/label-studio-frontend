import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Filter } from '../Filter';

describe('Filter', () => {
  const mockOnChange = jest.fn();
  const filterData = [
    {
      'labelName': 'AirPlane',
    },
    {
      'labelName': 'Car',
    },
    {
      'labelName': 'AirCar',
    },
  ];

  test('Validate if filter is rendering', () => {
    const filter = render(<Filter
      onChange={mockOnChange}
      filterData={filterData}
      availableFilters={[{
        label: 'Annotation results',
        path: 'labelName',
        type: 'String',
      },
      {
        label: 'Confidence score',
        path: 'score',
        type: 'Number',
      }]}
    />);

    const whereText = filter.getByText('Filter');

    expect(whereText).toBeDefined();
  });

  test('Should delete row when delete button is clicked', () => {
    const filter = render(<Filter
      onChange={mockOnChange}
      filterData={filterData}
      availableFilters={[{
        label: 'Annotation results',
        path: 'labelName',
        type: 'String',
      },
      {
        label: 'Confidence score',
        path: 'score',
        type: 'Number',
      }]}
    />);

    const FilterButton = filter.getByText('Filter');

    fireEvent.click(FilterButton);

    const AddButton = filter.getByText('Add Filter');

    fireEvent.click(AddButton);
    fireEvent.click(AddButton);

    const selectBox = filter.getByTestId('logic-dropdown');

    expect(selectBox.textContent).toBe('And');

    fireEvent.click(selectBox);
    fireEvent.click(screen.getByText('Or'));

    expect(selectBox.textContent).toBe('Or');

    fireEvent.click(screen.getByTestId('delete-row-1'));

    expect(filter.getAllByTestId('filter-row')).toHaveLength(1);
  });

  test('Should filter the content', () => {
    let filteredContent: any;

    const filter = render(<Filter
      onChange={value => {
        filteredContent = value;
      }}
      filterData={filterData}
      availableFilters={[{
        label: 'Annotation results',
        path: 'labelName',
        type: 'String',
      },
      {
        label: 'Confidence score',
        path: 'score',
        type: 'Number',
      }]}
    />);

    const FilterButton = filter.getByText('Filter');

    fireEvent.click(FilterButton);

    expect(screen.getByText('No filters applied')).toBeDefined();

    const AddButton = filter.getByText('Add Filter');

    fireEvent.click(AddButton);

    const fieldDropdown = filter.getByTestId('field-dropdown');
    const operationDropdown = filter.getByTestId('operation-dropdown');

    fireEvent.click(operationDropdown);
    fireEvent.click(screen.getByText('not contains'));

    const filterInput = filter.getByTestId('filter-input');

    expect(filterInput).toBeDefined();

    expect(fieldDropdown.textContent).toBe('Annotation results');
    expect(operationDropdown.textContent).toBe('not contains');

    fireEvent.change(filterInput, { target: { value: 'Plane' } });


    expect(filteredContent).toStrictEqual([{ labelName: 'Car' }, { labelName: 'AirCar' }]) ;
  });
});