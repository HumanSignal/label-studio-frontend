import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { useSDK } from 'src/App';
import { useRegionsController } from './useRegionsController';

export const useRegionsForTag = (annotationAtom: AnnotationAtom, name: string) => {
  const sdk = useSDK();
  const regions = useRegionsController(annotationAtom);

  const results = regions.listAtoms.filter((resultAtom) => {
    const result = sdk.get(resultAtom);

    return result?.toName === name;
  });

  return results;
};
