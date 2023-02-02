import { AnnotationInput, PredictionInput } from '@atoms/Inputs/AnnotationInput';
import { ResultInput } from '@atoms/Inputs/ResultInput';
import { atom } from 'jotai';
import { InternalSDK } from 'src/core/SDK/Internal/Internal.sdk';
import { WithInternalSDK } from 'src/core/SDK/Internal/WithInternalSDK';
import { guidGenerator } from 'src/utils/unique';
import { isDefined } from 'src/utils/utilities';
import { toCamelCase, toSnakeCase } from 'strman';
import { RegionsController } from '../RegionsAtom/RegionsController';
import { Annotation, AnnotationAtom, AnnotationEntity, EntityType } from './Types';

type AnnotationControllerOptions<Type extends EntityType = any> = Partial<{
  type: Type,
}>

export class AnnotationController<
  Type extends EntityType,
  InputType extends AnnotationEntity[Type]
> extends WithInternalSDK {
  atom: AnnotationAtom;
  result: RegionsController;

  constructor(
    internalSDK: InternalSDK,
    annotationRaw: InputType,
    options: AnnotationControllerOptions<Type>,
  ) {
    super(internalSDK);

    const isUserCreated = !isDefined(annotationRaw.id) || (typeof annotationRaw.id === 'string');
    const saved = typeof annotationRaw.id === 'number';

    const annotation: Annotation = {
      id: annotationRaw.id ?? guidGenerator(),
      userCreated: isUserCreated,
      type: options.type ?? 'annotation',
      createdBy: annotationRaw.createdBy ?? 'Admin',
      createdDate: annotationRaw.createdDate ?? new Date(),
      editable: annotationRaw.readonly ? false : true,
      saved,
      commentCount: 0,
      unresolvedCommentCount: 0,
      groundTruth: annotationRaw.groundTruth,
      skipped: annotationRaw.skipped ?? false,
      acceptedState: annotationRaw.acceptedState,
      score: options.type === 'prediction'
        ? (annotationRaw as PredictionInput).score
        : undefined,
    };

    this.atom = atom<Annotation>(annotation as Annotation);
    this.result = new RegionsController(this.sdk, annotationRaw.result);
  }

  createResult(rawResults: ResultInput[]) {
    return this.result.add(rawResults);
  }

  export() {
    const annotation = this.get(this.atom);
    const result = this
      .result
      .export()
      .filter((region) => region !== null) as ResultInput[];

    return { ...annotation, result } as AnnotationInput;
  }

  toJSON() {
    const exported = this.export();

    return toJSON(exported);
  }

  toServerJSON() {
    return toServerFormat(this.toJSON());
  }

  toServerFormat() {
    return toServerFormat(this.get(this.atom));
  }

  destroy() {
    this.result.destroy();
  }
}

type SnakeToCamelCase<S extends string> =
  S extends `${infer T}_${infer U}`
    ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
    : S

type CamelToSnakeCase<S extends string> =
  S extends `${infer T}${infer U}`
    ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnakeCase<U>}`
    : S;

type DeepSnakeKeys<T> = T extends Array<any>
  ? Array<DeepSnakeKeys<T[number]>>
  : T extends object
    ? { [K in keyof T as CamelToSnakeCase<K & string>]: DeepSnakeKeys<T[K]> }
    : T;

type DeepCamelKeys<T> = T extends Array<any>
  ? Array<DeepSnakeKeys<T[number]>>
  : T extends object
    ? { [K in keyof T as SnakeToCamelCase<K & string>]: DeepSnakeKeys<T[K]> }
    : T;

const _toSnakeCase = <T extends string>(str: T): CamelToSnakeCase<T> => {
  return toSnakeCase(str) as CamelToSnakeCase<T>;
};

export const toServerFormat = <
  T extends { [key: string]: any },
  Res extends DeepSnakeKeys<T>,
>(obj: T) => {
  return Object
    .entries(obj)
    .reduce((acc, [key, value]) => {
      const res: Res = {
        ...acc,
        [_toSnakeCase(key)]: Array.isArray(value)
          ? value.map((item) => toServerFormat(item))
          : typeof value === 'object' && value !== null
            ? toServerFormat(value)
            : value,
      };

      return res;
    }, {} as Res);
};

export const fromServerFormat = <
  T extends { [key: string]: any },
  Res extends DeepCamelKeys<T>,
>(obj: T) => {
  return Object
    .entries(obj)
    .reduce((acc, [key, value]) => {
      const res: Res = {
        ...acc,
        [toCamelCase(key)]: Array.isArray(value)
          ? value.map((item) => fromServerFormat(item))
          : typeof value === 'object' && value !== null
            ? fromServerFormat(value)
            : value,
      };

      return res;
    }, {} as Res);
};

/**
 * Function converts any JS object into a JSON compatible object.
 **/
export const toJSON = (obj: any) => {
  let json;

  try {
    json = JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.error(e);
  }

  return json;
};
