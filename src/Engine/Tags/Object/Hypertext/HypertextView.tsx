import { defineTagView } from '@tags/Base/TagController';
import { CreateTextView } from '../Text/TextView';
import { HypertextController } from './HypertextController';

const HypertextTagView = defineTagView(
  HypertextController,
  CreateTextView<typeof HypertextController>(),
);

export { HypertextTagView, HypertextController };
