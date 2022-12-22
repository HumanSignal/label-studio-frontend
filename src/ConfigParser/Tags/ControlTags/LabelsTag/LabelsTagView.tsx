import { BaseTagView } from '@tags/Base/BaseTag/BaseTagView';
import { Block } from 'src/utils/bem';

export const LabelsTagView: BaseTagView = ({
  tree,
  node,
  annotationAtom,
}) => {
  console.log('render labels');
  return (
    <Block name="labels">
      {tree.renderChildren({
        node: node.node,
        annotationAtom,
      })}
    </Block>
  );
};
