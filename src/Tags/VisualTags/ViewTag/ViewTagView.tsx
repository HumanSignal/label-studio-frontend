import { BaseTagView } from '@tags/Base/BaseTag/BaseTagView';
import { Fragment } from 'react';
import { Block } from 'src/utils/bem';

export const ViewTagView: BaseTagView = ({
  tree,
  annotationEntity,
  node,
}) => {
  const childList = Array.from(node.children);

  return (
    <Block name="view">
      {childList.map((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          return child.textContent;
        }
        const configNode = tree.getNode(child);

        return configNode ? (
          <Fragment key={configNode.id}>
            {tree.render({
              node: child,
              annotationEntity,
            })}
          </Fragment>
        ) : null;
      })}
    </Block>
  );
};
