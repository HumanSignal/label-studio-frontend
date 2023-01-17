import React from 'react';
import { render } from '@testing-library/react';
import { Seeker } from './Seeker';

describe('Seeker', () => {
  it('should render', () => {
    const { container } = render(<Seeker length={1009} step={16} position={1} seekOffset={0} seekVisible={72} onIndicatorMove={() => {}} onSeek={() => {}} />);

    expect(container).toMatchSnapshot();
  });

  // it('updates indicator based on position', () => {
  //   const { } = render(<Seeker length={1009} step={16} position={1} seekOffset={0} seekVisible={72} onIndicatorMove={() => {}} onSeek={() => {}} />);

  //   act

  //   expect(container).toMatchSnapshot();
  // });
});
