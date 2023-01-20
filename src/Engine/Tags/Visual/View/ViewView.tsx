import { defineTagView } from '@tags/Base/TagController';
import { Block } from 'src/utils/bem';
import { ViewController } from './ViewController';

const ViewView = defineTagView(ViewController, ({
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

export { ViewView, ViewController };
