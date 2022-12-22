import { BaseTagView } from '@tags/Base/BaseTag/BaseTagView';
import { Block } from 'src/utils/bem';

export const ViewTagView: BaseTagView = ({
  tree,
  annotationAtom,
  node,
}) => {
  return (
    <Block name="view">
      {tree.renderChildren({ node: node.node, annotationAtom })}
    </Block>
  );
};
