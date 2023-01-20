import { AnnotationInput, PredictionInput } from './AnnotationInput';

export type TaskInput = {
  id: number,
  queue?: string,
  data: string | Record<string, any>,
  annotations?: AnnotationInput[],
  predictions?: PredictionInput[],
  /**
   * @deprecated
   */
  completions?: AnnotationInput[],
}
