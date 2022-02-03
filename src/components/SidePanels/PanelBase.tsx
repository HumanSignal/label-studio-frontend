import { FC, useCallback, useMemo } from "react";
import { Block, Elem } from "../../utils/bem";

import "./PanelBase.styl";
import { PanelType } from "./SidePanels";

export type PanelBaseExclusiveProps = "name" | "title"

type ResizeHandler = (name: PanelType, size: number) => void;

interface PanelBaseProps {
  name: PanelType;
  title: string;
  width?: number;
  visible?: boolean;
  collapsable?: boolean;
  collapsed?: boolean;
  position?: "left" | "right";
  currentEntity?: any;
  icon?: JSX.Element;
  onResize?: ResizeHandler;
  onVisibilityChange?: (name: PanelType, visible: boolean) => void;
}

export type PanelProps = Omit<PanelBaseProps, PanelBaseExclusiveProps>

export const PanelBase: FC<PanelBaseProps> = ({
  name,
  title,
  width,
  visible,
  icon,
  onResize,
  onVisibilityChange,
  children,
  ...props
}) => {
  const resizeHandler = useMemo(() => {
    return (size: number) => onResize?.(name, size);
  }, [name, onResize]);

  const handleCollapse = useCallback(() => {
    console.log(visible);
    onVisibilityChange?.(name, !visible);
  }, [onVisibilityChange, visible]);

  const style = useMemo(() => {
    return visible ? {
      width: width ?? 320,
    } : {};
  }, [width, visible]);

  const mods = useMemo(() => {
    return {
      position: props.position ?? 'left',
      hidden: !visible,
    };
  }, [props.position, visible]);

  return (
    <Block
      name="panel"
      mix={name}
      mod={mods}
      style={style}
    >
      <Elem name="header" onClick={handleCollapse}>
        {visible ? title : icon}
      </Elem>
      {visible && (
        <Elem name="content">
          <Block name={name}>
            {children}
          </Block>
        </Elem>
      )}
    </Block>
  );
};
