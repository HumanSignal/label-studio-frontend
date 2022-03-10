import { FC, MutableRefObject, MouseEvent as RMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { IconCollapseLeft } from '../../assets/icons';

import "./PanelBase.styl";
import { PanelType } from "./SidePanels";
import { useDrag } from "../../hooks/useDrag";
import { clamp, isDefined } from "../../utils/utilities";

export type PanelBaseExclusiveProps = "name" | "title"

type ResizeHandler = (name: PanelType, width: number, height: number, top: number, left: number) => void;

type SnapHandler = (name: PanelType) => void

type DetachHandler = (name: PanelType, detached: boolean) => void

type PositonChangeHandler = (name: PanelType, top: number, left: number, detached: boolean) => void;

type VisibilityChangeHandler = (name: PanelType, visible: boolean) => void;

const resizers = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "top",
  "bottom",
  "right",
  "left",
];

interface PanelBaseProps {
  root: MutableRefObject<HTMLDivElement | undefined>;
  name: PanelType;
  title: string;
  top: number;
  left: number;
  width: number;
  height: number;
  visible: boolean;
  alignment: "left" | "right";
  currentEntity: any;
  icon: JSX.Element;
  detached: boolean;
  expanded: boolean;
  locked: boolean;
  onResize: ResizeHandler;
  onSnap: SnapHandler;
  onDetach: DetachHandler;
  onPositionChange: PositonChangeHandler;
  onVisibilityChange: VisibilityChangeHandler;
}

export type PanelProps = Omit<PanelBaseProps, PanelBaseExclusiveProps>

const distance = (x1: number, x2: number, y1: number, y2: number) => {
  return Math.sqrt(
    Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2),
  );
};

export const PanelBase: FC<PanelBaseProps> = ({
  name,
  root,
  title,
  width,
  height,
  visible,
  icon,
  detached,
  alignment,
  expanded,
  top,
  left,
  locked = false,
  onSnap,
  onDetach,
  onResize,
  onVisibilityChange,
  onPositionChange,
  children,
  ...props
}) => {
  const headerRef = useRef<HTMLDivElement>();
  const panelRef = useRef<HTMLDivElement>();
  const resizerRef = useRef<HTMLDivElement>();
  const [dragLocked, setLocked] = useState(false);
  const handlers = useRef({ onDetach, onResize, onPositionChange, onVisibilityChange, onSnap });
  const [resizing, setResizing] = useState<string | undefined>();

  const handleCollapse = useCallback((e: RMouseEvent<HTMLOrSVGElement>) => {
    if (dragLocked) return;
    e.stopPropagation();
    e.preventDefault();
    onVisibilityChange?.(name, false);
  }, [onVisibilityChange, dragLocked]);

  const handleExpand = useCallback(() => {
    if (dragLocked) return;
    onVisibilityChange?.(name, true);
  }, [onVisibilityChange, dragLocked]);

  const style = useMemo(() => {
    return visible ? {
      height: detached ? height ?? '100%' : '100%',
      width: expanded ? "100%" : width ?? 320,
    } : {};
  }, [width, height, visible, detached, expanded]);

  const coordinates = useMemo(() => {
    return detached && !locked ? {
      transform: `translate3d(${left}px, ${top}px, 0)`,
    } : {};
  }, [detached, left, top, locked]);

  const mods = useMemo(() => {

    return {
      detached: locked ? false : detached,
      resizing: isDefined(resizing),
      hidden: !visible,
      alignment: alignment ?? "left",
      disabled: locked,
    };
  }, [alignment, visible, detached, resizing, locked]);

  useEffect(() => {
    Object.assign(handlers.current, { onDetach, onResize, onPositionChange, onVisibilityChange, onSnap });
  }, [onDetach, onResize, onPositionChange, onVisibilityChange, onSnap]);

  // Panel positioning
  useDrag({
    elementRef: headerRef,
    disabled: locked,

    onMouseDown(e) {
      const allowDrag = detached;
      const panel = panelRef.current!;
      const parentBBox = root.current!.getBoundingClientRect();
      const bbox = panel.getBoundingClientRect();
      const [x, y] = [e.pageX, e.pageY];
      const [oX, oY] = [
        bbox.left - parentBBox.left,
        bbox.top - parentBBox.top,
      ];

      return { x, y, oX, oY, allowDrag };
    },

    onMouseMove(e, { x, y, oX, oY, allowDrag }) {
      const [mX, mY] = [e.pageX, e.pageY];
      const dist = distance(x, mX, y, mY);

      if (dist > 30) {
        setLocked(true);
        allowDrag = true;
      }

      if (!allowDrag) return;

      const [nX, nY] = [oX + (mX - x), oY + (mY - y)];

      handlers.current.onPositionChange?.(name, nY, nX, true);
    },

    onMouseUp() {
      setTimeout(() => setLocked(false), 50);
      handlers.current.onSnap?.(name);
    },
  }, [headerRef, detached, dragLocked, locked]);

  // Panel resizing
  useDrag({
    elementRef: resizerRef,
    disabled: locked,

    onMouseDown(e) {
      const target = e.target as HTMLElement;
      const type = target.dataset.resize;
      const shift = (() => {
        switch(type) {
          case "top-left":
            return "top-left";
          case "top":
          case "top-right":
            return "top";
          case "left":
          case "bottom-left":
            return "left";
        }
      })();

      const resizeDirections = (() => {
        return {
          x: type?.match(/left|right/i) !== null,
          y: type?.match(/top|bottom/i) !== null,
        };
      })();

      setResizing(type);

      return {
        pos: [e.pageX, e.pageY],
        type,
        width,
        height,
        top,
        left,
        resizeDirections,
        shift,
      };
    },
    onMouseMove(e, {
      pos,
      width: w,
      height: h,
      top: t,
      left: l,
      resizeDirections,
      shift,
    }) {
      const [sX, sY] = pos;
      const wMod = resizeDirections.x ? e.pageX - sX : 0;
      const hMod = resizeDirections.y ? e.pageY - sY : 0;

      const shiftLeft = ["left", "top-left"].includes(shift);
      const shiftTop = ["top", "top-left"].includes(shift);

      const width = clamp((shiftLeft ? w - wMod : w + wMod), 320, Infinity);
      const height = clamp((shiftTop ? h - hMod : h + hMod), 320, Infinity);

      const top = shiftTop ? (t + (h - height)) : t;
      const left = shiftLeft ? (l + (w - width)) : l;

      handlers.current.onResize(
        name,
        width,
        height,
        top,
        left,
      );
    },
    onMouseUp() {
      setResizing(undefined);
    },
  }, [handlers, width, height, top, left, visible, dragLocked, locked]);

  return (
    <Block
      ref={panelRef}
      name="panel"
      mix={name}
      mod={mods}
      style={{ ...style, ...coordinates }}
    >
      <Elem name="content">
        {!locked && (
          <Elem
            ref={headerRef}
            name="header"
            onClick={handleExpand}
          >
            {visible ? (
              <>{title} {<IconCollapseLeft onClick={handleCollapse}/>}</>
            ) : icon}
          </Elem>
        )}
        {visible && (
          <Elem name="body">
            <Block name={name}>
              {children}
            </Block>
          </Elem>
        )}
      </Elem>

      {visible && !dragLocked && !locked && (
        <Elem name="resizers" ref={resizerRef}>
          {resizers.map((res) => {
            const shouldRender = ((res === 'left' || res === 'right') && alignment !== res || detached) || detached;

            return shouldRender ? (
              <Elem
                key={res}
                name="resizer"
                mod={{ drag: res === resizing }}
                data-resize={res}
              />
            ) : null;
          })}
        </Elem>
      )}
    </Block>
  );
};
