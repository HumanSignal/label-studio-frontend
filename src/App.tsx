import { DataStore } from '@components/App/DataStore';
import { LabelingInterface } from '@components/App/LabelingInterface';
import { createContext, FC, StrictMode, useContext } from 'react';
import { Store } from 'src/Engine/Atoms/Store';
import { InternalSDK } from './core/SDK/Internal/Internal.sdk';

type AppProps = {
  store: Store,
  sdk: InternalSDK,
  afterInit: () => void,
};

const SDKContext = createContext<InternalSDK | null>(null);

export const App: FC<AppProps> = ({
  store,
  sdk,
  afterInit,
}) => {
  return (
    <StrictMode>
      <DataStore store={store} afterInit={afterInit}>
        <SDKContext.Provider value={sdk}>
          <LabelingInterface/>
        </SDKContext.Provider>
      </DataStore>
    </StrictMode>
  );
};

export const useSDK = () => {
  const sdk = useContext(SDKContext);

  if (!sdk) {
    throw new Error('SDK is not provided');
  }

  return sdk;
};
