import React, { CSSProperties, FC } from "react";
import { PropTypes } from "prop-types";
import { observer } from "mobx-react";
import { Block } from "../../utils/bem";

interface ObjectTagViewProps {
  item: any;
  className?: string;
  style?: CSSProperties;
}

/**
 * Object Tag Component
 */
const ObjectTagView: FC<ObjectTagViewProps> = ({
  item,
  style,
  className,
  children,
}) => {

  const moreProps = item.getProps && item.getProps();

  return (
    <Block
      name="object"
      className={className}
      dataneedsupdate={item._needsUpdate}
      style={style}
      {...moreProps}
    >
      {children}
    </Block>
  );
};

export const ObjectTag = observer(ObjectTagView);

export default observer(ObjectTagView);
