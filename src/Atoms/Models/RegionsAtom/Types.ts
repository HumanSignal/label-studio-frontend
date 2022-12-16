import { Atom, PrimitiveAtom } from 'jotai';

export type Region = {
  id: string,
}

export type Regions = {
  regions: Atom<Region>[],
  selection: Set<string>,
  group: 'manual' | 'label' | 'type',
  orderBy: 'score' | 'date',
  order: 'asc' | 'desc',
}

export type RegionsAtom = PrimitiveAtom<Regions>;
