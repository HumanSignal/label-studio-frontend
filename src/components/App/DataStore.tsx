import { Store } from '@atoms/Store';
import { useAtomsDevtools } from 'jotai/devtools';
import { FC, ReactElement } from 'react';
import { useDataStore } from '../../hooks/useDataStore';

type DataStoreProps = {
  children: ReactElement<any, any> | null,
  store: Store,
  afterInit: () => void,
};

export const DataStore: FC<DataStoreProps> = ({
  children,
  store,
  afterInit,
}) => {
  useDataStore(store, afterInit);
  useAtomsDevtools('Label Studio');

  return children;
};
