import { useSingleAnnotationController } from '@atoms/Models/AnnotationsAtom/Hooks/useAnnotationsController';
import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';

export const useRegionsController = (annotationAtom: AnnotationAtom) => {
  const annotationController = useSingleAnnotationController(annotationAtom)!;

  return annotationController.result;
};
