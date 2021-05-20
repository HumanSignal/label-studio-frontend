import React from "react";
import { BemWithSpecifiContext } from "../../utils/bem";
import "./Space.styl";

const { Block } = BemWithSpecifiContext();

export const Space = ({
  direction = "horizontal",
  size,
  className,
  style,
  children,
  spread,
  stretch,
  align,
  collapsed,
  ...rest
}) => {
  return (
    <Block name="space" mod={{ direction, size, spread, stretch, align, collapsed }} mix={className} style={style} {...rest}>
      {children}
    </Block>
  );
};
