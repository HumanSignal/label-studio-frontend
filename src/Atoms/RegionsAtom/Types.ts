import { Atom } from 'jotai';

export type Region = {
  id: string,
}

export type Regions = {
  regions: Atom<Region[]>,
  selection: Set<string>,
}
