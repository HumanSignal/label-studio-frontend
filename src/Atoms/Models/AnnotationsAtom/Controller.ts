import { Atom, atom } from 'jotai';
import { useSDK } from 'src/App';
import { guidGenerator } from '../../../utils/unique';
import { AnnotationInput, PredictionInput } from '../../Inputs/AnnotationInput';
import { StoreAccess } from '../../StoreAccess';
import { Regions } from '../RegionsAtom/Types';
import { annotationsAtom, annotationsListAtom, predictionsListAtom, selectedAnnotationPropertyAtom, writableAnnotationsListAtom } from './AnnotationsAtom';
import { Annotation, AnnotationAtom, EntityType } from './Types';

/**
 * Operates on the AnnotationStore
 */
export class AnnotationController extends StoreAccess {
  /**
   * List all the annotations
   */
  get annotations() {
    const annotationsAtom = this.store.get(annotationsListAtom);

    if (!annotationsAtom) return [];

    return annotationsAtom ?? [];
  }

  /**
   * Convers an annotation to a prediction and adds it to the list of predictions
   */
  annotationToPrediction(annotationAtom: AnnotationAtom) {
    const annotation = this.store.get(annotationAtom);

    const prediction = this.create({
      ...annotation,
      type: 'prediction',
      userGenerate: true,
    });

    this.store.set(predictionsListAtom, (list) => {
      return [...list, prediction];
    });

    return prediction;
  }

  /**
   * Selects the annotation or prediction for rendering
   */
  select(annotaionAtom: AnnotationAtom) {
    if (!annotaionAtom) return;

    this.store.set(selectedAnnotationPropertyAtom, annotaionAtom);
  }

  delete(annotaionAtom: AnnotationAtom) {
    const type = this.store.get(annotaionAtom)?.type;

    if (type === 'prediction') {
      this.store.set(predictionsListAtom, (list) => {
        return list.filter((item) => item !== annotaionAtom);
      });
    } else {
      this.store.set(annotationsListAtom, (list) => {
        return list.filter((item) => item !== annotaionAtom);
      });
    }
  }

  /**
   * Finds the first annotation in the list and selects it if exists
   */
  selectFirstAnnotation() {
    const annotation = this.annotations.at(0);

    if (!annotation) return;

    this.select(annotation as AnnotationAtom);
  }

  create(patch?: Partial<Annotation>) {
    const newAnnotation = this.createEntity({
      id: guidGenerator(),
      userGenerate: true,
      ...(patch ?? {}),
    }, 'annotation');

    this.store.set(writableAnnotationsListAtom, {
      type: 'insert',
      value: newAnnotation,
    });

    return newAnnotation;
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
      this.createEntity(prediction, 'prediction') as Atom<Annotation>);

    this.store.patch(annotationsAtom, {
      annotations: annotationsAtoms,
      predictions: predictionsAtoms,
    });
  }

  /**
   * Creates a new annotation atom
   */
  private createEntity({ id, ...raw }: Partial<AnnotationInput | PredictionInput>, type: EntityType) {
    const initialValue: Partial<Annotation> = {
      id: id ?? guidGenerator(),
      regions: this.createRegionsAtom(),
      type,
      onlyTextObjects: false,
      unresolved_comment_count: 0,
      comment_count: 0,
      createdDate: Date.now(),
      result: [],
      versions: {},
      userGenerate: false,
      sentUserGenerate: false,
      ground_truth: false,
      editable: true,
      acceptedState: null,
      results: [],
      skipped: false,
      history: [],
    };

    const annotation = atom<Annotation>({
      ...initialValue,
      ...raw,
    } as Annotation);

    return annotation as AnnotationAtom;
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

export const useAnnotationsController = () => {
  const SDK = useSDK();

  return SDK.annotations;
};
