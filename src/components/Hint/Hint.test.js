/* global describe, it, expect */
import React from 'react';
import Hint from './Hint';
import { render } from '@testing-library/react';

describe('Hint', () => {
  it('Should render correctly', () => {
    const component = (
      <Hint copy="test" style={{ background: 'red' }} className="test">
        Test
      </Hint>
    );

    const output = render(component);

    expect(output.asFragment()).toMatchSnapshot();
  });
});
