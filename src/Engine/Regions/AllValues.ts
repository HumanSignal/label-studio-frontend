import { HypertextValue } from './Hypertext/HypertextValue';
import { TextValue } from './Text/TextValue';

export {
  HypertextValue,
  TextValue
};

export type RegionValueType =
  | HypertextValue
  | TextValue;
