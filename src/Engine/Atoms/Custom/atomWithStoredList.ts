import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
export const atomWithStoredList = (key: string, defaultValue: string[]) => {
  const storedValue = atomWithStorage(key, defaultValue.toString());

  return atom((get) => {
    const value = get(storedValue);

    return value.split(',');
  }, (get, set, newValue: string[]) => {
    const uniqueValues = Array.from(new Set(newValue));

    set(storedValue, uniqueValues.join(','));
  });
};
