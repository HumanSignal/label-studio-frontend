import { AnnotationInput, PredictionInput } from './AnnotationInput';

export type TaskInput = {
  id: number,
  queue?: string,
  data: string,
  annotations?: AnnotationInput[],
  predictions?: PredictionInput[],
  /**
   * @deprecated
   */
  completions?: AnnotationInput[],
}
