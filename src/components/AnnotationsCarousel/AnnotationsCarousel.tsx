// import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { Block, Elem } from '../../utils/bem';
import { IconArrowLeft, IconArrowRight } from '../../assets/icons';
import { Button } from '../../common/Button/Button';
import './AnnotationsCarousel.styl';
import { AnnotationButton } from './AnnotationButton';
import { useEffect, useState } from 'react';

interface AnnotationsCarouselInterface {
  store: any;
  annotationStore: any; 
  commentStore?: any;
}

export const AnnotationsCarousel = ({ store, annotationStore, commentStore }: AnnotationsCarouselInterface) => {
  const [entities, setEntities] = useState<any[]>([]);
  const enableAnnotations = store.hasInterface('annotations:tabs');
  const enablePredictions = store.hasInterface('predictions:tabs');
  const enableCreateAnnotation = store.hasInterface('annotations:add-new');
  const groundTruthEnabled = store.hasInterface('ground-truth');
  const enableAnnotationDelete = store.hasInterface('annotations:delete');
  
  console.log('AnnotationsCarousel', store, annotationStore, commentStore);

  useEffect(() => {
    const newEntities = [];

    if (enablePredictions) newEntities.push(...annotationStore.predictions);
  
    if (enableAnnotations) newEntities.push(...annotationStore.annotations);
    setEntities(newEntities);
  }, [annotationStore, JSON.stringify(annotationStore.predictions), JSON.stringify(annotationStore.annotations)]);
  
  return (enableAnnotations || enablePredictions || enableCreateAnnotation) ? (
    <Block name='annotations-carousel'>
      <Elem name='container'>
        <Elem name='carosel'>
          {entities.map(entity => (
            <AnnotationButton 
              key={entity?.id} 
              entity={entity} 
              capabilities={{
                enablePredictions,
                enableCreateAnnotation,
                groundTruthEnabled,
                enableAnnotations,
                enableAnnotationDelete,
              }}
              annotationStore={annotationStore}
            />
          ))}
        </Elem>
      </Elem>
      <Elem name='carousel-controls'>
        <Elem tag={Button} name='nav' mod={{ left: true }} aria-label="Carousel left" onClick={(e: MouseEvent) => console.log('left', e.type)}><IconArrowLeft /></Elem>
        <Elem tag={Button} name='nav' mod={{ right: true }} aria-label="Carousel right" onClick={(e: MouseEvent) => console.log('right', e.type)}><IconArrowRight /></Elem>
      </Elem>
    </Block>
  ): null;
};
