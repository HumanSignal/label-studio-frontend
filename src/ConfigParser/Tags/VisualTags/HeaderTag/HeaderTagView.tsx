import { BaseTagView } from '@tags/Base/BaseTag/BaseTagView';
import { Block } from 'src/utils/bem';

export const HeaderTagView: BaseTagView = ({
  node,
}) => {
  console.log('render header');
  return (
    <Block name="header">
      <h1>{node.node.textContent}</h1>
    </Block>
  );
};
