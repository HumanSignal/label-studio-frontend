import { HypertextLabelsController } from '../HypertextLabels/HypertextLabelsTagController';
import { LabelsController } from './LabelsController';

export type LabelsTagViewControllerClass =
  | typeof LabelsController
  | typeof HypertextLabelsController;

export type LabelsTagViewController = LabelsTagViewControllerClass['prototype'];
