import { PrimitiveAtom, WritableAtom } from 'jotai';

type SplitAtomAction<Item> = {
  type: 'remove',
  atom: PrimitiveAtom<Item>,
} | {
  type: 'insert',
  value: Item,
  before?: PrimitiveAtom<Item>,
} | {
  type: 'move',
  atom: PrimitiveAtom<Item>,
  before?: PrimitiveAtom<Item>,
};

type DeprecatedAtomToRemove<Item> = PrimitiveAtom<Item>;

export type SplittedAtom<T> = WritableAtom<
PrimitiveAtom<T>[],
SplitAtomAction<T> | DeprecatedAtomToRemove<T>,
void
>
