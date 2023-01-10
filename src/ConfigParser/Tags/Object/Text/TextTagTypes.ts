import { HypertextTagController } from '../Hypertext/HypertextTagController';
import { TextTagController } from './TextTagController';

export type TextTagViewControllerClass = typeof TextTagController | typeof HypertextTagController;
export type TextTagViewController = TextTagViewControllerClass['prototype'];
