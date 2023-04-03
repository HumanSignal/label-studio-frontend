import { FilterListInterface } from './FilterInterfaces';

export const FilterItems = (items: any[], filterItem: FilterListInterface) => {
  switch (filterItem.operation) {
    case 'contains':
      return contains(items, filterItem);
    case 'not_contains':
      return notcontains(items, filterItem);
    case 'equal':
      return equal(items, filterItem);
    case 'not_equal':
      return notequal(items, filterItem);
    default:
      return items;
  }
};


const contains = (items: any[], filterItem: FilterListInterface) => {
  if (filterItem.value) {
    return items.filter((obj) => {
      const item = getFilteredPath(filterItem.path, obj);

      return item.toLowerCase().includes(filterItem.value.toLowerCase());
    });
  } else {
    return items;
  }
};

const notcontains = (items: any[], filterItem: FilterListInterface) => {
  if (filterItem.value) {
    return items.filter((obj) => {
      const item = getFilteredPath(filterItem.path, obj);

      return !item.toLowerCase().includes(filterItem.value.toLowerCase());
    });
  } else {
    return items;
  }
};

const equal = (items: any[], filterItem: FilterListInterface) => {
  if (filterItem.value) {
    return items.filter((obj) => {
      const item = getFilteredPath(filterItem.path, obj);

      return item.toString().toLowerCase() === filterItem.value.toLowerCase();
    });
  } else {
    return items;
  }
};

const notequal = (items: any[], filterItem: FilterListInterface) => {
  if (filterItem.value) {
    return items.filter((obj) => {
      const item = getFilteredPath(filterItem.path, obj);

      return item.toString().toLowerCase() !== filterItem.value.toLowerCase();
    });
  } else {
    return items;
  }
};

const getFilteredPath = (path: string | string[], items: any[], separator='.') => {
  const properties = Array.isArray(path) ? path : path.split(separator);

  return properties.reduce((prev, curr) => prev?.[curr], items);
};