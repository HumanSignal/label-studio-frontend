import React, { DOMAttributes, FC, forwardRef, ForwardRefExoticComponent } from "react";
import { Block, CNTagName, Elem } from "../../utils/bem";
import { isDefined } from "../../utils/utilities";
import "./Button.styl";

export interface ButtonProps extends DOMAttributes<HTMLButtonElement> {
  type: "text" | "link";
  href?: string;
  extra?: JSX.Element;
  className?: string;
  size?: 'small' | 'medium' | "compact" | 'large';
  waiting?: boolean;
  icon?: JSX.Element;
  tag?: CNTagName;
  look?: "primary" | "danger" | "destructive";
  primary?: boolean;
}

export interface ButtonGroupProps {
  className?: string;
  collapsed?: boolean;
}

export interface ButtonType<P> extends ForwardRefExoticComponent<P> {
  Group?: FC<ButtonGroupProps>;
}

export const Button: ButtonType<ButtonProps> = forwardRef(({
  children,
  type,
  extra,
  className,
  size,
  waiting,
  icon,
  tag,
  look,
  primary,
  ...rest
}, ref) => {
  const finalTag = tag ?? (rest.href ? "a" : "button");

  const mods = {
    size,
    waiting,
    type,
    look: look ?? [],
    withIcon: !!icon,
    withExtra: !!extra,
  };

  if (primary) {
    mods.look = 'primary';
  }

  const iconElem = React.useMemo(() => {
    if (!icon) return null;
    if (isDefined(icon.props.size)) return icon;

    switch (size) {
      case "small":
        return React.cloneElement(icon, { ...icon.props, size: 12, width: 12, height: 12 });
      case "compact":
        return React.cloneElement(icon, { ...icon.props, size: 14, width: 14, height: 14 });
      default:
        return icon;
    }
  }, [icon, size]);

  return (
    <Block
      name="button"
      mod={mods}
      mix={className}
      ref={ref}
      tag={finalTag}
      type={type}
      {...rest}
    >
      <>
        {iconElem && (
          <Elem tag="span" name="icon">
            {iconElem}
          </Elem>
        )}
        {iconElem && children ? <span>{children}</span> : children}
        {extra !== undefined ? <Elem name="extra">{extra}</Elem> : null}
      </>
    </Block>
  );
});

Button.displayName = "Button";


const Group: FC<ButtonGroupProps> = ({ className, children, collapsed }) => {
  return (
    <Block name="button-group" mod={{ collapsed }} mix={className}>
      {children}
    </Block>
  );
};

Button.Group = Group;
