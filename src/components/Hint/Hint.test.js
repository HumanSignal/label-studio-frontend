/* global describe, it, expect */
import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import { shallowToJson } from 'enzyme-to-json';
import Adapter from '@cfaester/enzyme-adapter-react-18';

Enzyme.configure({ adapter: new Adapter() });

import Hint from './Hint';

describe('Hint', () => {
  it('Should render correctly', () => {
    const component = (
      <Hint copy="test" style={{ background: 'red' }} className="test">
        Test
      </Hint>
    );

    const output = shallow(component);

    expect(shallowToJson(output)).toMatchSnapshot();
  });
});
