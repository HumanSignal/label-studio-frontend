export interface FilterInterface {
  availableFilters: AvailableFiltersInterface[];
  onChange?: () => void;
  filterData: any;
  filteringPath?: string;
}

export interface FilterListInterface {
  field?: string | string[] | undefined;
  operation?: string | string[] | undefined;
  value?: string | string[] | undefined;
}

export interface AvailableFiltersInterface {
  label: string;
  path: string;
  type: 'Boolean' | 'Common' | 'Number' | 'String' | string;
}