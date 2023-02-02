import { ReviewState } from '@atoms/Models/AnnotationsAtom/Types';
import { ResultInput } from './ResultInput';

export type AnnotationInput = {
  id: string | number,
  result: ResultInput[],
  skipped?: boolean,
  acceptedState?: ReviewState,
  readonly?: boolean,
  createdBy?: string,
  createdDate?: number | string | Date,
  createdAgo?: number | string | Date,
  unresolvedCommentCount?: number,
  commentCount?: number,
  groundTruth?: boolean,
}

export type PredictionInput = AnnotationInput & {
  score?: number,
  modelVersion?: string,
  modelId?: string,
}
