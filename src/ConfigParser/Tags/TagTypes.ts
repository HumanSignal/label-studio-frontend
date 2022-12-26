import { HypertextLabelsTagController } from './ControlTags/HypertextLabelsTag/HypertextLabelsTagController';
import { LabelsTagController } from './ControlTags/LabelsTag/LabelsTagController';
import { LabelTagController } from './ControlTags/LabelTag/LabelTagController';
import { HeaderTagController } from './VisualTags/HeaderTag/HeaderTagController';
import { ViewTagController } from './VisualTags/ViewTag/ViewTagController';

export const TagTypes = {
  [ViewTagController.type]: ViewTagController,
  [HypertextLabelsTagController.type]: HypertextLabelsTagController,
  [LabelsTagController.type]: LabelsTagController,
  [LabelTagController.type]: LabelTagController,
  [HeaderTagController.type]: HeaderTagController,
};
