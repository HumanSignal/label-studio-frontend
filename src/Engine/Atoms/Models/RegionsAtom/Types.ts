export type Region = {
  id: string,
  toName: string,
}

export type Result = {
  fromName: string,
  value: Record<string, any>,
  score: number,
  origin: 'prediction' | 'prediction-changed' | 'manual',
}
