import { BaseTagView } from '@tags/Base/BaseTag/BaseTagView';
import { Block } from 'src/utils/bem';

export const HypertextLabelsTagView: BaseTagView = ({
  node,
}) => {
  console.log({ node });

  return (
    <Block name="labels">
      Labels
    </Block>
  );
};
