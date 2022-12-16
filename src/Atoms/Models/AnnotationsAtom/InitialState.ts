import { AnnotationsStore } from './Types';

export const InitialState: AnnotationsStore = {
  annotations: [],
  predictions: [],
  annotationHistory: [],
  viewingAllAnnotations: false,
  viewingAllPredictions: false,
  validation: null,
  names: new Map(),
};
