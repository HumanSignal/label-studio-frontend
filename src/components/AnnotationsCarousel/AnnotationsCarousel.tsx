// import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { Block, Elem } from '../../utils/bem';
import { IconArrowLeft, IconArrowRight } from '../../assets/icons';
import { Button } from '../../common/Button/Button';
import './AnnotationsCarousel.styl';
import { AnnotationButton } from './AnnotationButton';

interface AnnotationsCarouselInterface {
  store?: any;
  annotationStore?: any; 
  commentStore?: any;
}

export const AnnotationsCarousel = ({ store, annotationStore, commentStore }: AnnotationsCarouselInterface) => {
  

  const enableAnnotations = store.hasInterface('annotations:tabs');
  const enablePredictions = store.hasInterface('predictions:tabs');
  const enableCreateAnnotation = store.hasInterface('annotations:add-new');
  // const groundTruthEnabled = store.hasInterface('ground-truth');

  const entities = [];


  if (enablePredictions) entities.push(...annotationStore.predictions);

  if (enableAnnotations) entities.push(...annotationStore.annotations);
  
  console.log('AnnotationsCarousel', store, annotationStore, commentStore, entities);

  return (enableAnnotations || enablePredictions || enableCreateAnnotation) ? (
    <Block name='annotations-carousel'>
      <Elem name='container'>
        <Elem name='carosel'>
          {entities.map(entity => <AnnotationButton key={entity.id} entity={entity} />)}
        </Elem>
      </Elem>
      <Elem name='carousel-controls'>
        <Elem tag={Button} name='nav' mod={{ left: true }} aria-label="Carousel left" onClick={(e: MouseEvent) => console.log('left', e.type)}><IconArrowLeft /></Elem>
        <Elem tag={Button} name='nav' mod={{ right: true }} aria-label="Carousel right" onClick={(e: MouseEvent) => console.log('right', e.type)}><IconArrowRight /></Elem>
      </Elem>
    </Block>
  ): null;
};
