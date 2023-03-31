export interface FilterInterface {
  availableFilters: AvailableFiltersInterface[];
  onChange?: () => void;
  filterData: any;
}

export interface FilterListInterface {
  field?: string | string[] | undefined;
  operation?: string | string[] | undefined;
  value?: string | string[] | undefined;
  path: string;
}

export interface AvailableFiltersInterface {
  label: string;
  path: string;
  type: 'Boolean' | 'Common' | 'Number' | 'String' | string;
}