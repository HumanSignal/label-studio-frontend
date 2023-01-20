import { useAtomValue } from 'jotai';
import { useSDK } from 'src/App';
import { AnnotationAtom } from '../Types';

export const useAnnotationRegions = (annotationAtom: AnnotationAtom) => {
  const sdk = useSDK();

  return sdk.annotations.getResultsAtom(annotationAtom)!;
};

export const useTagRegions = (annotationAtom: AnnotationAtom, name: string) => {
  const sdk = useSDK();
  const resultsReaderAtom = sdk.annotations.getResultsAtom(annotationAtom)!;
  const result = useAtomValue(resultsReaderAtom.resultListAtom);

  const results = result.filter((resultAtom) => {
    const result = sdk.store.get(resultAtom);

    return result?.to_name === name;
  });

  return results;
};
