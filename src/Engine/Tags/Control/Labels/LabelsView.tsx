import { defineTagView } from '@tags/Base/TagController';
import { TagView } from '@tags/Base/TagView';
import { Block } from 'src/utils/bem';
import { LabelsController } from './LabelsController';
import { LabelsTagViewControllerClass } from './LabelsTypes';

import './Labels.styl';

export const CreateLabelsView = function <T extends LabelsTagViewControllerClass>(): TagView<T> {
  return ({
    tree,
    node,
    annotationAtom,
    controller,
  }) => {
    const mods = {
      hidden: !controller.visible.value,
      inline: controller.showInline.value,
    };

    return (
      <Block name="labels" mod={mods}>
        {tree.renderChildren({
          node: node.element,
          annotationAtom,
        })}
      </Block>
    );
  };
};

export const LabelsView = defineTagView(
  LabelsController,
  CreateLabelsView<typeof LabelsController>(),
);

export { LabelsController };
