import { useSDK } from 'src/App';
import { AnnotationAtom } from '../Types';

export const useAnnotationsController = () => {
  const SDK = useSDK();

  return SDK.annotations;
};

export const useSingleAnnotationController = (annotationAtom: AnnotationAtom) => {
  const SDK = useSDK();
  const controller = SDK.annotations.getController(annotationAtom);

  return controller;
};
