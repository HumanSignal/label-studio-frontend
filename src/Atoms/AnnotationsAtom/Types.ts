import { Atom } from 'jotai';
import { Regions } from '@atoms/RegionsAtom/Types';

type AnnotationBase = {
  id: string,
  type: string,
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
  current?: Annotation | Prediction,
  currentHistory?: AnnotationHistoryItem,
  annotations: Annotation[],
  predictions: Prediction[],
  annotationHistory: AnnotationHistoryItem[],
  viewingAllAnnotations: boolean,
  viewingAllPredictions: boolean,
  validation: ConfigValidation | null,
  names: Map<string, any>,
}
