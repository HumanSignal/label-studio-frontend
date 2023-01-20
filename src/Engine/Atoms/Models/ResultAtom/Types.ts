import { ResultType, ResultValueBase } from '@result/ResultValueBase';
import { TagType } from '@tags/Base/TagController';
import { PrimitiveAtom, SetStateAction, WritableAtom } from 'jotai';

export type Result<Value extends ResultType<ResultValueBase> = any> = {
  id: string,
  from_name: string,
  to_name: string,
  type: TagType,
  value: Value,
}

export type ResultAtom = WritableAtom<Result, SetStateAction<Partial<Result>>>

export type Results = {
  result: Result[],
  selection: Set<string>,
  group: 'manual' | 'label' | 'type',
  orderBy: 'score' | 'date',
  order: 'asc' | 'desc',
}

export type ResultsAtom = PrimitiveAtom<Results>;
