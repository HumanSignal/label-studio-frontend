import { Setter } from 'jotai';
import { atom, Getter } from 'jotai/vanilla';

type MappedAtomAction<K, V> =
  | { type: 'set', key: K, value: V }
  | { type: 'delete', key: string }
  | { type: 'clear' }

export const mappedAtom = <
  Weak extends boolean,
  InputType extends Map<any, any>,
  InputTypeKey extends keyof InputType,
  InputTypeValue extends InputType[InputTypeKey],
>(
  initialValue: InputType | [InputTypeKey, InputTypeValue][],
  weak?: Weak,
) => {
  const internalMap = weak
    ? new WeakMap(initialValue)
    : new Map(initialValue);

  const read = () => {
    return internalMap;
  };

  const write = (
    _get: Getter,
    _set: Setter,
    action: MappedAtomAction<InputTypeKey, InputTypeValue>,
  ) => {
    switch(action.type) {
      case 'set':
        internalMap.set(action.key, action.value);
        break;
      case 'delete':
        internalMap.delete(action.key);
        break;
      case 'clear':
        if (internalMap instanceof Map) internalMap.clear();
        break;
    }

    return internalMap;
  };

  return atom(read, write);
};
