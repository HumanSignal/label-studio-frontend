export type ResultInput = {
  id: string,
  type: string,
  from_name: string,
  to_name: string,
  score: number,
  value: Record<string, any>,
  origin: 'prediction' | 'prediction-changed' | 'manual',
}
