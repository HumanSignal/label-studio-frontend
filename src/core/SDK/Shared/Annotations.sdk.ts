import { Annotation, EntityType, Prediction } from '@atoms/AnnotationsAtom/Types';
import { Atom, atom } from 'jotai';
import { AnnotationsAtom, AnnotationsListAtom, SelectedAnnotationAtom } from '../../../Atoms/AnnotationsAtom/AnnotationsAtom';
import { AnnotationInput, PredictionInput } from '../../Data/Inputs/AnnotationInput';
import { guidGenerator } from '../../Helpers';
import { StoreAccess } from './StoreAccess.sdk';

/**
 * Operates on the AnnotationStore
 */
export class AnnotationsSDK extends StoreAccess {
  get annotations() {
    const annotationsAtom = this.store.get(AnnotationsListAtom);

    if (!annotationsAtom) return [];

    return this.store.get(annotationsAtom) ?? [];
  }

  /**
   * Selects the annotation or prediction for rendering
   */
  select(annotaionAtom: Atom<Annotation | Prediction>) {
    if (!annotaionAtom) return;

    this.store.set(SelectedAnnotationAtom, annotaionAtom);
  }

  selectFirstAnnotation() {
    const annotation = this.annotations.at(0);

    if (!annotation) return;

    this.select(annotation);
  }

  /**
   * Hydrate annotaions and predictions
   */
  hydrate({
    annotations,
    predictions,
  }: {
    annotations: AnnotationInput[],
    predictions: PredictionInput[],
  }) {
    const annotationsAtoms = annotations.map((annotation) =>
      this.createEntity(annotation, 'annotation') as Atom<Annotation>);
    const predictionsAtoms = predictions.map((prediction) =>
      this.createEntity(prediction, 'prediction') as Atom<Prediction>);

    this.store.set(AnnotationsAtom, (state) => {
      return {
        ...state,
        annotations: annotationsAtoms,
        predictions: predictionsAtoms,
      };
    });
  }

  private createEntity({ id, ...raw }: AnnotationInput | PredictionInput, type: EntityType) {
    const annotation = atom<Annotation | Prediction>({
      id: id ?? guidGenerator(),
      regions: this.createRegionsAtom(),
      type,
      onlyTextObjects: false,
      ...raw,
    });

    return annotation;
  }

  private createRegionsAtom() {
    return atom({
      regions: atom([]),
      selection: new Set<string>(),
    });
  }
}
