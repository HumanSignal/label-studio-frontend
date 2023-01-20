import { AnnotationInput, PredictionInput } from '@atoms/Inputs/AnnotationInput';
import { Store } from '@atoms/Store';
import { atom } from 'jotai';
import { guidGenerator } from 'src/utils/unique';
import { isDefined } from 'src/utils/utilities';
import { toCamelCase, toSnakeCase } from 'strman';
import { Annotation, AnnotationAtom, AnnotationEntity, EntityType } from './Types';

export class AnnotationController<
  Type extends EntityType,
  InputType extends AnnotationEntity[Type]
> extends Store {
  annotationAtom: AnnotationAtom;

  constructor(annotationRaw: InputType, options: Partial<{
    type: Type,
    onlyTextObjects: boolean,
    saved: boolean,
  }>) {
    super();

    const isUserCreated = !isDefined(annotationRaw.id) || (typeof annotationRaw.id === 'string');
    const annotation: Annotation = {
      id: annotationRaw.id ?? guidGenerator(),
      userCreated: isUserCreated,
      type: options.type ?? 'annotation',
      createdBy: annotationRaw.createdBy,
      createdDate: annotationRaw.createdDate,
      editable: annotationRaw.readonly ? false : true,
      onlyTextObjects: options.onlyTextObjects ?? false,
      saved: options.saved ?? false,
      commentCount: 0,
      unresolvedCommentCount: 0,
      groundTruth: annotationRaw.groundTruth,
      skipped: annotationRaw.skipped ?? false,
      acceptedState: annotationRaw.acceptedState,
      score: options.type === 'prediction'
        ? (annotationRaw as PredictionInput).score
        : undefined,
    };

    this.annotationAtom = atom<Annotation>(annotation as Annotation);
  }

  toServerFormat() {
    return toServerFormat(this.get(this.annotationAtom));
  }
}

export const toServerFormat = (annotation: Annotation) => {
  return Object
    .entries(annotation)
    .reduce((acc, [key, value]) => ({
      ...acc,
      [toSnakeCase(key)]: value,
    }), {});
};

export const fromServerFormat = (annotation: AnnotationInput) => {
  return Object
    .entries(annotation)
    .reduce((acc, [key, value]) => {
      return {
        ...acc,
        [toCamelCase(key)]: value,
      };
    }, {});
};
