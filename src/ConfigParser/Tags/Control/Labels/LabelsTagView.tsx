import { defineTagView } from '@tags/Base/Base/BaseTagController';
import { Block } from 'src/utils/bem';
import './LabelsTag.styl';
import { LabelsTagController } from './LabelsTagController';

const LabelsTagView = defineTagView(LabelsTagController, ({
  tree,
  node,
  annotationAtom,
  controller,
}) => {
  const mods = {
    // hidden: !controller.visible.value,
    inline: controller.showinline.value,
  };

  return (
    <Block name="labels" mod={mods}>
      {tree.renderChildren({
        node: node.element,
        annotationAtom,
      })}
    </Block>
  );
});

export { LabelsTagView, LabelsTagController };
