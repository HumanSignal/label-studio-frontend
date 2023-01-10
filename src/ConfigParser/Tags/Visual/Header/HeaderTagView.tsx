import { defineTagView } from '@tags/Base/Base/BaseTagController';
import { Block } from 'src/utils/bem';
import { HeaderTagController } from './HeaderTagController';

const HeaderTagView = defineTagView(HeaderTagController, ({
  node,
}) => {
  return (
    <Block name="header">
      <h1>{node.element.textContent}</h1>
    </Block>
  );
});

export { HeaderTagView, HeaderTagController };
