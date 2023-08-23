/**
 * Initializing Test Environment
 */
/* global jest, global */

import { configure } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

configure({ adapter: new Adapter() });
