import { useSDK } from 'src/App';

export const useAnnotationsController = () => {
  const SDK = useSDK();

  return SDK.annotations;
};
