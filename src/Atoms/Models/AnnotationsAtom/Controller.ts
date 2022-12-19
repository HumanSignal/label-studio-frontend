import { Atom, atom } from 'jotai';
import { guidGenerator } from '../../../utils/unique';
import { AnnotationInput, PredictionInput } from '../../Inputs/AnnotationInput';
import { StoreAccess } from '../../StoreAccess';
import { Regions } from '../RegionsAtom/Types';
import { AnnotationsAtom, AnnotationsListAtom, SelectedAnnotationAtom } from './AnnotationsAtom';
import { Annotation, AnnotationOrPrediction, EntityType, Prediction } from './Types';

/**
 * Operates on the AnnotationStore
 */
export class AnnotationController extends StoreAccess {
  /**
   * List all the annotations
   */
  get annotations() {
    const annotationsAtom = this.store.get(AnnotationsListAtom);

    if (!annotationsAtom) return [];

    return annotationsAtom ?? [];
  }

  /**
   * Selects the annotation or prediction for rendering
   */
  select(annotaionAtom: Atom<AnnotationOrPrediction>) {
    if (!annotaionAtom) return;

    this.store.set(SelectedAnnotationAtom, annotaionAtom);
  }

  /**
   * Finds the first annotation in the list and selects it if exists
   */
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

    this.store.patch(AnnotationsAtom, {
      annotations: annotationsAtoms,
      predictions: predictionsAtoms,
    });
  }

  /**
   * Creates a new annotation atom
   */
  private createEntity({ id, ...raw }: AnnotationInput | PredictionInput, type: EntityType) {
    const annotation = atom<AnnotationOrPrediction>({
      id: id ?? guidGenerator(),
      regions: this.createRegionsAtom(),
      type,
      onlyTextObjects: false,
      ...raw,
    });

    return annotation;
  }

  /**
   * Creates a new regions atom
   */
  private createRegionsAtom() {
    return atom<Regions>({
      regions: [],
      selection: new Set<string>(),
      group: 'manual',
      orderBy: 'date',
      order: 'asc',
    });
  }
}
