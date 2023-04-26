export enum Logic {
  and = 'And',
  or = 'Or',
}

export interface FilterInterface {
  availableFilters: AvailableFiltersInterface[];
  onChange: (filter: any) => void;
  filterData: any;
}

export interface FilterListInterface {
  field?: string | string[] | undefined;
  operation?: string | string[] | undefined;
  value?: any;
  path?: string;
  logic?: Logic;
}

export interface AvailableFiltersInterface {
  label: string;
  path: string;
  type: 'Boolean' | 'Common' | 'Number' | 'String' | string;
}
