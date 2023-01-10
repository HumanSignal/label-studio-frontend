import * as Colors from './colors';
import * as UDate from './date';
import { debounce } from './debounce';
import * as Floodfill from './floodfill';
import * as HTML from './html';
import * as Image from './image';
import * as Selection from './selection-tools';
import { styleToProp } from './styles';
import { guidGenerator } from './unique';
import * as Checkers from './utilities';

export const Utils = {
  Image,
  HTML,
  Checkers,
  Colors,
  UDate,
  guidGenerator,
  debounce,
  styleToProp,
  Floodfill,
  Selection,
};

export { Utils as default };
