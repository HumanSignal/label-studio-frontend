import { atom } from 'jotai';

type SetAtomAction<V> =
  | { type: 'add', value: V }
  | { type: 'delete', value: V }
  | { type: 'clear' }

export const atomWithSet = <
  InitialValueType extends (Weak extends true ? object : any),
  InitialValue extends Weak extends (undefined | false) ? InitialValueType[] | Set<InitialValueType> : InitialValueType[],
  Output extends Weak extends (undefined | false)
    ? Set<InitialValueType>
    : InitialValue extends Set<InitialValueType>
      ? never
      : WeakSet<InitialValueType>,
  Weak extends boolean | undefined = undefined,
>(
  initialValue: InitialValue,
  weak?: Weak,
) => {
  const internalSet = (weak
    ? new WeakSet<InitialValueType>(initialValue)
    : new Set<InitialValueType>(initialValue)) as Output;

  const result = atom((
    _get,
  ) => {
    return internalSet;
  }, (
    _get,
    _set,
    action: SetAtomAction<InitialValueType>,
  ) => {
    switch (action.type) {
      case 'add':
        internalSet.add(action.value);
        break;
      case 'delete':
        internalSet.delete(action.value);
        break;
      case 'clear':
        if (internalSet instanceof Set) internalSet.clear();
        break;
    }

    console.log('internalSet', internalSet);
  });

  return result;
};
