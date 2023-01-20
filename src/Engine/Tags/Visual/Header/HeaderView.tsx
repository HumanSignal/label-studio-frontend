import { defineTagView } from '@tags/Base/TagController';
import { Block } from 'src/utils/bem';
import { HeaderController } from './HeaderController';

const HeaderView = defineTagView(HeaderController, ({
  node,
}) => {
  return (
    <Block name="header">
      <h1>{node.element.textContent}</h1>
    </Block>
  );
});

export { HeaderView, HeaderController };
