import { BaseTagView } from '@tags/Base/BaseTag/BaseTagView';
import { Block } from 'src/utils/bem';

export const LabelsTagView: BaseTagView = ({
  tree,
  node,
  annotationAtom,
}) => {
  console.log({ node });

  return (
    <Block name="labels">
      {tree.renderChildren({
        node: node.node,
        annotationAtom,
      })}
    </Block>
  );
};
