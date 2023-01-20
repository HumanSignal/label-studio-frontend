import { defineTagView } from '@tags/Base/TagController';
import { CreateLabelsView } from '../Labels/LabelsView';
import { HypertextLabelsController } from './HypertextLabelsTagController';

defineTagView(
  HypertextLabelsController,
  CreateLabelsView<typeof HypertextLabelsController>(),
);
