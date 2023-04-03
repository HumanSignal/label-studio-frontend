import { FilterItems } from '../filter-util';

describe('FilterItems', () => {
  const items = [
    {
      item: {
        name: 'Car', value: 25,
      },
    },{
      item: {
        name: 'AirPlane', value: 30,
      },
    },{
      item: {
        name: 'Car Flower', value: 40,
      },
    },
  ];

  test('should filter items that contain the specified value', () => {
    const filterItem = { operation: 'contains', path: 'item.name', value: 'Car' };
    const filteredItems = FilterItems(items, filterItem);

    expect(filteredItems).toEqual([
      {
        item: {
          name: 'Car', value: 25,
        },
      },{
        item: {
          name: 'Car Flower', value: 40,
        },
      },
    ]);
  });

  test('should filter items that do not contain the specified value', () => {
    const filterItem = { operation: 'not_contains', path: 'item.name', value: 'Car' };
    const filteredItems = FilterItems(items, filterItem);

    expect(filteredItems).toEqual([
      {
        item: {
          name: 'AirPlane', value: 30,
        },
      },
    ]);
  });

  test('should return all items when value is empty', () => {
    const filterItem = { operation: 'contains', path: 'item.name', value: '' };
    const filteredItems = FilterItems(items, filterItem);

    expect(filteredItems).toEqual(items);
  });

  test('should return all items when operation is invalid', () => {
    const filterItem = { operation: 'invalid_operation', path: 'item.name', value: 'Doe' };
    const filteredItems = FilterItems(items, filterItem);

    expect(filteredItems).toEqual(items);
  });
});