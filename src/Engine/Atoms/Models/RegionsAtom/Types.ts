import { ResultValueType } from '../../../Regions/RegionValue';

export type Region = {
  id: string,
  toName: string,
}

export type Result = {
  type: ResultValueType,
  fromName: string,
  score: number,
  origin: 'prediction' | 'prediction-changed' | 'manual',
  value: Record<string, any>,
}

export type RegionOrder = {
  selection: Set<string>,
  group: 'manual' | 'label' | 'type',
  orderBy: 'score' | 'date',
  order: 'asc' | 'desc',
}
