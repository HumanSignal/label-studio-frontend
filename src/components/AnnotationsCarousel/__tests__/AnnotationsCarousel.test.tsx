/* global test, expect, jest */
import React from 'react';
import { render } from "@testing-library/react";
import { AnnotationsCarousel } from '../AnnotationsCarousel';
// eslint-disable-next-line
// @ts-ignore
import { annotationStore, store } from './sampleData.js';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

test('AnnotationsCarousel', async () => {
  const view = render(
    <AnnotationsCarousel
      annotationStore={annotationStore}
      store={store}
    />
  );
  const carouselItems = view.container.querySelectorAll('.dm-annotations-carousel__carosel > *');

  expect(carouselItems).toHaveLength(9);
});
