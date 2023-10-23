/* global test, expect, jest, describe */
import { render } from '@testing-library/react';
import { AnnotationButton } from '../AnnotationButton';
// eslint-disable-next-line
// @ts-ignore
import { annotationStore } from './sampleData.js';
import '@testing-library/jest-dom';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

describe('AnnotationsButton', () => {
  test('Annotation', () => {
    const entity = annotationStore.annotations[0];
    const view = render(<AnnotationButton entity={entity} capabilities={{}} annotationStore={annotationStore} />);

    expect(view.getByText(`#${entity.pk}`)).toBeInTheDocument();
  });

  test('Prediction', () => {
    const entity = annotationStore.predictions[0];
    const view = render(<AnnotationButton entity={entity} capabilities={{}} annotationStore={annotationStore} />);

    expect(view.getByText(`#${entity.pk}`)).toBeInTheDocument();
  });
});
