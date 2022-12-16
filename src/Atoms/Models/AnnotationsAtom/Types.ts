import { Atom } from 'jotai';
import { Regions } from '../RegionsAtom/Types';

export type EntityType = 'annotation' | 'prediction';

export type AnnotationBase = {
  id: string,
  type: EntityType | 'history',
  onlyTextObjects: boolean,
  regions: Atom<Regions>,
}

export type Annotation = AnnotationBase & {
  type: 'annotation',
}

export type Prediction = AnnotationBase & {
  type: 'prediction',
}

export type AnnotationHistoryItem = AnnotationBase & {
  type: 'history',
}

export type ConfigValidation = {
  valid: boolean,
}

export type AnnotationsStore = {
  current?: Atom<Annotation | Prediction>,
  currentHistory?: Atom<AnnotationHistoryItem>,
  annotations: Atom<Annotation>[],
  predictions: Atom<Prediction>[],
  annotationHistory: AnnotationHistoryItem[],
  viewingAllAnnotations: boolean,
  viewingAllPredictions: boolean,
  validation: ConfigValidation | null,
  names: Map<string, any>,
}
