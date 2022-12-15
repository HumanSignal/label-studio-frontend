export type Result = {
  id: string,
};

export type AnnotationInput = {
  id: string,
  result: Result[],
}

export type PredictionInput = AnnotationInput & {
  score?: number,
}
