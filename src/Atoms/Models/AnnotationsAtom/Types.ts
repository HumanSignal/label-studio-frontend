import { Atom, SetStateAction, WritableAtom } from 'jotai';
import { Regions } from '../RegionsAtom/Types';

export type EntityType = 'annotation' | 'prediction';

export type AnnotationAcceptance =
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
  id: string,
  type: EntityType | 'history' | 'draft',
  onlyTextObjects: boolean,
  regions: Atom<Regions>,
  unresolved_comment_count: number,
  comment_count: number,
  ground_truth?: boolean,
  skipped: boolean,
  acceptedState?: AnnotationAcceptance | null,
  createdDate: number | string | Date,
  editable: boolean,

  // TODO: remove this
  sentUserGenerate: boolean,
  userGenerate: boolean,
  result: any,
  history: any,
  versions: any,
  results: any,
}

export type ConfigValidation = {
  valid: boolean,
}

export type AnnotationAtom = WritableAtom<Annotation, SetStateAction<Partial<Annotation>>>

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
