import { PrimitiveAtom } from 'jotai';
import { AnnotationInput, PredictionInput } from 'src/Engine/Atoms/Inputs/AnnotationInput';

export type AnnotationEntity = {
  prediction: PredictionInput,
  annotation: AnnotationInput,
}

export type EntityType = keyof AnnotationEntity;

export type AnnotationType = AnnotationEntity[keyof AnnotationEntity]

export type ReviewState =
  | 'accepted'
  | 'rejected'
  | 'fixed_and_accepted'
  | 'updated'
  | 'submitted'
  | 'prediction'
  | 'imported'
  | 'skipped'
  | 'draft_created'
  | 'deleted_review'
  | 'propagated_annotation';

export type Annotation = {
  id: string | number,
  type: EntityType | 'history' | 'draft',
  unresolvedCommentCount: number,
  commentCount: number,
  groundTruth?: boolean,
  skipped: boolean,
  createdBy: string,
  acceptedState?: ReviewState | null,
  createdDate: number | string | Date,
  editable: boolean,
  score?: number,

  // result: Results,
  // history: any,
  // versions: any,

  // TODO: remove this
  saved: boolean,
  userCreated: boolean,
}

export type ConfigValidation = {
  valid: boolean,
}

export type AnnotationAtom = PrimitiveAtom<Annotation>

export type AnnotationsStore = {
  current?: AnnotationAtom,
  currentHistory?: AnnotationAtom,
  annotations: AnnotationAtom[],
  predictions: AnnotationAtom[],
  annotationHistory: Annotation[],
  viewingAllAnnotations: boolean,
  viewingAllPredictions: boolean,
  validation: ConfigValidation | null,
  names: Map<string, any>,
}
