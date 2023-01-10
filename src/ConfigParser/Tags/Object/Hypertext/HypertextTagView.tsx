import { defineTagView } from '@tags/Base/Base/BaseTagController';
import { CreateTextView } from '../Text/TextTagView';
import { HypertextTagController } from './HypertextTagController';

const HypertextTagView = defineTagView(
  HypertextTagController,
  CreateTextView<typeof HypertextTagController>(),
);

export { HypertextTagView, HypertextTagController };
