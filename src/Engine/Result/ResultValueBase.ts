import { StoreAccess } from '@atoms/StoreAccess';

export class ResultValueBase<Output extends {} = any> extends StoreAccess {
  toJSON(): Output;
  toJSON(): Output {
    throw new Error('Not implemented');
  }
}

export type ResultType<T> = T extends ResultValueBase<infer Output> ? Output : never;
