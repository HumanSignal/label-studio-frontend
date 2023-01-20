import { ResultValueBase } from '@result/ResultValueBase';
import { TagType } from '@tags/Base/TagController';
import { guidGenerator } from '../../../../utils/unique';
import { AnnotationInput, PredictionInput } from '../../Inputs/AnnotationInput';
import { StoreAccess } from '../../StoreAccess';
import { createResultsAtom } from '../ResultAtom/ResultAtom';
import { annotationsListAtom, selectedAnnotationAtom, selectedAnnotationPropertyAtom, writableAnnotationsListAtom, writablePredictionsListAtom } from './AnnotationsAtom';
import { Annotation, AnnotationAtom, AnnotationEntity, EntityType } from './Types';

/**
 * Operates on the AnnotationStore
 */
export class AnnotationController extends StoreAccess {
  private results = new WeakMap<AnnotationAtom, ReturnType<typeof createResultsAtom>>();
  /**
   * List all the annotations
   */
  get annotations() {
    const annotationsAtom = this.store.get(annotationsListAtom);

    if (!annotationsAtom) return [];

    return annotationsAtom ?? [];
  }

  get selected() {
    const annotation = this.store.get(selectedAnnotationAtom);

    return annotation ? this.store.get(annotation) : undefined;
  }

  getResults(annotationAtom: AnnotationAtom, name: string) {
    const annotation = this.store.get(annotationAtom);
    const result = annotation.result;

    const results = result?.result.filter((resultAtom) => {
      return resultAtom?.to_name === name;
    });

    return results;
  }

  /**
   * Convers an annotation to a prediction and adds it to the list of predictions
   */
  annotationToPrediction(annotationAtom: AnnotationAtom) {
    const annotation = this.store.get(annotationAtom);

    const prediction = this.createEntity({
      ...annotation,
      userGenerate: true,
    }, 'prediction');

    this.store.set(writablePredictionsListAtom, {
      type: 'insert',
      value: prediction,
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
      this.store.set(writablePredictionsListAtom, {
        type: 'remove',
        atom: annotaionAtom,
      });
    } else {
      this.store.set(writableAnnotationsListAtom, {
        type: 'remove',
        atom: annotaionAtom,
      });
    }
  }

  /**
   * Finds the first annotation in the list and selects it if exists
   */
  selectFirstAnnotation() {
    const annotation = this.store.get(writableAnnotationsListAtom).at(0);

    if (!annotation) return;

    this.select(annotation);
  }

  create<
    Patch extends Partial<AnnotationInput> | Partial<Annotation>,
  >(patch?: Patch) {
    const newAnnotation = this.createEntity({
      id: guidGenerator(),
      userGenerate: true,

      ...(patch ?? {}),
    }, 'annotation');

    this.store.set(writableAnnotationsListAtom, {
      type: 'insert',
      value: newAnnotation,
    });

    return this.store.get(writableAnnotationsListAtom).at(-1);
  }

  createResult<R extends ResultValueBase>(
    resultValue: R,
    annotationAtom: AnnotationAtom,
    options: {
      fromName: string,
      toName: string,
      type: TagType,
    },
  ) {
    const results = createResultsAtom(annotationAtom)!;

    this.store.set(results.resultListAtom, {
      type: 'insert',
      value: {
        id: guidGenerator(),
        from_name: options.fromName,
        to_name: options.toName,
        type: options.type,
        value: resultValue,
      },
    });
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
    this.fillStore(annotations, 'annotation');
    this.fillStore(predictions, 'prediction');
  }

  private fillStore<T extends EntityType>(
    list: AnnotationEntity[T][],
    type: T,
  ) {
    const store = type === 'annotation' ? writableAnnotationsListAtom : writablePredictionsListAtom;

    for (const item of list) {
      const annotationData = this.createEntity(item, type);

      this.store.set(store, { type: 'insert', value: annotationData });
      const entityAtom = this.store.get(store).at(-1);

      if (entityAtom) createResultsAtom(entityAtom);
    }
  }

  /**
   * Creates a new annotation atom
   */
  private createEntity<
    InputType extends EntityType,
    InputData extends AnnotationEntity[InputType],
  >({ id, ...raw }: Partial<InputData> | Partial<Annotation>, type: InputType) {

    const initialValue = {
      id: id ?? guidGenerator(),
      type,
      onlyTextObjects: false,
      unresolvedCommentCount: 0,
      commentCount: 0,
      createdDate: Date.now(),
      groundTruth: false,
      editable: true,
      acceptedState: null,
      skipped: false,
      userCreated: false,
      saved: false,
      createdBy: raw.createdBy ?? 'user',
    };

    // const annotationAtom = atom<Annotation>({
    //   ...initialValue,
    //   ...raw,
    // } as Annotation) as AnnotationAtom;

    // this.createRegionsAtom(annotationAtom, result);

    return initialValue as Annotation;
  }

  getResultsAtom(annotationAtom: AnnotationAtom) {
    return this.results.get(annotationAtom);
  }
}
