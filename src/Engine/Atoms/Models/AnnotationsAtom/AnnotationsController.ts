import { ResultInput } from '@atoms/Inputs/ResultInput';
import { RESET } from 'jotai/utils';
import { InternalSDK } from 'src/core/SDK/Internal/Internal.sdk';
import { WithInternalSDK } from 'src/core/SDK/Internal/WithInternalSDK';
import { guidGenerator } from '../../../../utils/unique';
import { AnnotationInput, PredictionInput } from '../../Inputs/AnnotationInput';
import { AnnotationController } from './AnnotationController';
import { annotationsAtom, annotationsListAtom, predictionsListAtom, selectedAnnotationAtom, selectedAnnotationPropertyAtom } from './AnnotationsAtom';
import { Annotation, AnnotationAtom, AnnotationEntity, AnnotationType, EntityType } from './Types';

/**
 * Operates on the AnnotationStore
 */
export class AnnotationsController extends WithInternalSDK {
  private controllers = new WeakMap<AnnotationAtom, AnnotationController<EntityType, AnnotationType>>();

  constructor(internalSDK: InternalSDK) {
    super(internalSDK);
  }

  /**
   * List all the annotations
   */
  get annotations() {
    const annotationsAtom = this.get(annotationsListAtom);

    if (!annotationsAtom) return [];

    return annotationsAtom ?? [];
  }

  get selected() {
    const annotationAtom = this.get(selectedAnnotationAtom);

    return annotationAtom ? this.get(annotationAtom) : undefined;
  }

  get selectedController() {
    const annotationAtom = this.get(selectedAnnotationAtom);

    return annotationAtom ? this.controllers.get(annotationAtom) : undefined;
  }

  getResults(annotationAtom: AnnotationAtom, name: string) {
    const controller = this.controllers.get(annotationAtom)!;
    const regions = this.get(controller.result.atom);

    const results = regions.filter((resultAtom) => {
      const region = this.get(resultAtom);

      return region.toName === name;
    });

    return results;
  }

  /**
   * Convers an annotation to a prediction and adds it to the list of predictions
   */
  annotationToPrediction(annotationAtom: AnnotationAtom) {
    const annotationController = this.controllers.get(annotationAtom)!;
    const annotation = annotationController.export();
    const prediction = this.createAnnotationController(annotation, 'prediction');

    this.addAnnotation(prediction.atom, 'prediction');

    return prediction;
  }

  /**
   * Selects the annotation or prediction for rendering
   */
  select(annotaionAtom: AnnotationAtom) {
    this.set(selectedAnnotationPropertyAtom, annotaionAtom);
  }

  delete(annotaionAtom: AnnotationAtom) {
    const type = this.get(annotaionAtom).type as EntityType;

    this.removeAnnotation(annotaionAtom, type);
  }

  /**
   * Finds the first annotation in the list and selects it if exists
   */
  selectFirstAnnotation() {
    const annotationAtom = this.get(annotationsListAtom).at(0);

    if (!annotationAtom) return;

    this.select(annotationAtom);
  }

  create<
    Patch extends Partial<AnnotationInput | Annotation>,
  >(patch?: Patch) {
    const annotationController = this.createAnnotationController({
      id: guidGenerator(),
      ...(patch ?? {}),
    } as AnnotationInput, 'annotation');

    return annotationController.atom;
  }

  createResult<R extends ResultInput>(
    resultValue: R,
    annotationAtom: AnnotationAtom,
  ) {
    const controller = this.controllers.get(annotationAtom);

    if (!controller) return;

    const result = controller.createResult([resultValue]);

    return result;
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

  getController(annotationAtom: AnnotationAtom) {
    return this.controllers.get(annotationAtom);
  }

  destroy() {
    this.get(annotationsListAtom).forEach((annotationAtom) => {
      const controller = this.controllers.get(annotationAtom);

      if (!controller) return;

      controller.destroy();

      this.controllers.delete(annotationAtom);
    });

    this.get(predictionsListAtom).forEach((annotationAtom) => {
      const controller = this.controllers.get(annotationAtom);

      if (!controller) return;

      controller.destroy();

      this.controllers.delete(annotationAtom);
    });

    this.set(annotationsAtom, RESET);
  }

  private fillStore<T extends EntityType>(
    list: AnnotationEntity[T][],
    type: T,
  ) {
    for (const item of list) {
      this.createAnnotationController(item, type);
    }
  }

  private createAnnotationController<
    InputType extends EntityType,
    InputData extends AnnotationEntity[InputType],
  >(
    input: InputData,
    type: InputType,
  ) {
    const annotationController = new AnnotationController(this.sdk, input, {
      type,
    });

    this.controllers.set(annotationController.atom, annotationController);
    this.addAnnotation(annotationController.atom, type);

    return annotationController;
  }

  private addAnnotation(annotaionAtom: AnnotationAtom, type: EntityType) {
    const store = type === 'annotation'
      ? annotationsListAtom
      : predictionsListAtom;

    this.set(store, (list) => [...list, annotaionAtom]);
  }

  private removeAnnotation(annotaionAtom: AnnotationAtom, type: EntityType) {
    const store = type === 'annotation'
      ? annotationsListAtom
      : predictionsListAtom;

    this.set(store, (list) => list.filter((atom) => atom !== annotaionAtom));
  }
}
