import { ResultValueType } from 'src/Engine/Regions/RegionValue';

export type ResultInput = {
  id: string,
  type: ResultValueType,
  from_name: string,
  to_name: string,
  score: number,
  origin: 'prediction' | 'prediction-changed' | 'manual',
  value: Record<string, any>,
}
