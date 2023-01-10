import { defineTagView } from '@tags/Base/Base/BaseTagController';
import { Block } from 'src/utils/bem';
import { ViewTagController } from './ViewTagController';

const ViewTagView = defineTagView(ViewTagController, ({
  tree,
  annotationAtom,
  node,
}) => {
  return (
    <Block name="view">
      {tree.renderChildren({ node: node.element, annotationAtom })}
    </Block>
  );
});

export { ViewTagView, ViewTagController };
