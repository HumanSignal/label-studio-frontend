import { atom, useSetAtom } from 'jotai';
import { useMemo } from 'react';
import { Store } from '@atoms/Store';

// Use a write only atom to init the store instance
const storeAtom = atom(null, (get, set, storeInstance: Store) => {
  storeInstance.init(get, set);
});

// Can use this to setup an outside store instance (could be globally referenced or not)
// and you can use useEffect or useMemo, I used useMemo here because I am returning the store
// ref as a convenience option.
export const useDataStore = (storeInstance: Store, afterInit: () => void) => {
  const initStore = useSetAtom(storeAtom);

  return useMemo(() => {
    if (storeInstance.initialized) {
      return storeInstance;
    }

    initStore(storeInstance);
    afterInit();

    return storeInstance;
    // eslint-disable-next-line
  }, []);
};
