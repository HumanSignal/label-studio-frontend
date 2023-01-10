import { HypertextTagController, TextTagController } from './AllTags';
import { BaseTagController, TagType } from './Base/Base/BaseTagController';
import { HypertextLabelsTagController } from './Control/HypertextLabels/HypertextLabelsTagController';
import { LabelTagController } from './Control/Label/LabelTagController';
import { LabelsTagController } from './Control/Labels/LabelsTagController';
import { HeaderTagController } from './Visual/Header/HeaderTagController';
import { ViewTagController } from './Visual/View/ViewTagController';

export const TagTypes: Record<TagType, typeof BaseTagController> = {
  [ViewTagController.type]: ViewTagController,
  [HypertextLabelsTagController.type]: HypertextLabelsTagController,
  [LabelsTagController.type]: LabelsTagController,
  [LabelTagController.type]: LabelTagController,
  [HeaderTagController.type]: HeaderTagController,
  [HypertextTagController.type]: HypertextTagController,
  [TextTagController.type]: TextTagController,
};
