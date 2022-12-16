import { BaseTagView } from '@tags/Base/BaseTag/BaseTagView';

export const HeaderTagView: BaseTagView = ({
  node,
}) => {
  return (
    <div>
      <h1>{node.node.textContent}</h1>
    </div>
  );
};
