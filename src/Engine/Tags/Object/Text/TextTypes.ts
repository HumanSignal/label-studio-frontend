import { HypertextController } from '../Hypertext/HypertextController';
import { TextController } from './TextController';

export type TextViewControllerClass = typeof TextController | typeof HypertextController;
export type TextViewController = TextViewControllerClass['prototype'];

export type DoubleClickSelection = {
  time: number,
  value?: string[],
  x: number,
  y: number,
}
