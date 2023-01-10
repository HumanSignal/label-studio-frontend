import { defineTagView } from '@tags/Base/Base/BaseTagController';
import { Block } from 'src/utils/bem';
import { HypertextLabelsTagController } from './HypertextLabelsTagController';

defineTagView(HypertextLabelsTagController, ({
  tree,
  node,
  annotationAtom,
  controller,
}) => {
  const mods = {
    hidden: !controller.visible.value,
    inline: controller.showinline.value,
  };

  return (
    <Block name="labels" mods={mods}>
      {tree.renderChildren({
        node: node.element,
        annotationAtom,
      })}
    </Block>
  );
});
