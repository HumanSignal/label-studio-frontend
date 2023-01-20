import { ReviewState } from '@atoms/Models/AnnotationsAtom/Types';
import { Result } from '@atoms/Models/ResultAtom/Types';

export type AnnotationInput = {
  id: string,
  skipped: boolean,
  acceptedState?: ReviewState,
  readonly?: boolean,
  result: Result[],
  createdBy: string,
  createdDate: number | string | Date,
  unresolvedCommentCount: number,
  commentCount: number,
  groundTruth?: boolean,
}

export type PredictionInput = AnnotationInput & {
  score?: number,
}
