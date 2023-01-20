import { HypertextController, TextController } from './AllTags';
import { TagController, TagType } from './Base/TagController';
import { HypertextLabelsController } from './Control/HypertextLabels/HypertextLabelsTagController';
import { LabelController } from './Control/Label/LabelController';
import { LabelsController } from './Control/Labels/LabelsController';
import { HeaderController } from './Visual/Header/HeaderController';
import { ViewController } from './Visual/View/ViewController';

export const TagTypes: {
  [key in TagType]: typeof TagController;
} = {
  [ViewController.type]: ViewController,
  [HypertextLabelsController.type]: HypertextLabelsController,
  [LabelsController.type]: LabelsController,
  [LabelController.type]: LabelController,
  [HeaderController.type]: HeaderController,
  [HypertextController.type]: HypertextController,
  [TextController.type]: TextController,
};
