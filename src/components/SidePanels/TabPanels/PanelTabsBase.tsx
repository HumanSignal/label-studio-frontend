import { FC, MouseEvent as RMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Block, Elem } from '../../../utils/bem';
import { IconArrowLeft, IconArrowRight, IconOutlinerCollapse, IconOutlinerDrag, IconOutlinerExpand } from '../../../assets/icons';
import { useDrag } from '../../../hooks/useDrag';
import { clamp, isDefined } from '../../../utils/utilities';
import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_WIDTH, PANEL_HEADER_HEIGHT } from '../constants';
import { BaseProps, Side } from './types';
import { resizers } from './utils';
import './PanelTabsBase.styl';

const distance = (x1: number, x2: number, y1: number, y2: number) => {
  return Math.sqrt(
    Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2),
  );
};

export const PanelTabsBase: FC<BaseProps> = ({
  name: key,
  root,
  width,
  maxWidth,
  height,
  visible,
  detached,
  alignment,
  expanded,
  top,
  left,
  relativeTop,
  relativeLeft,
  zIndex,
  locked = false,
  positioning = false,
  onSnap,
  onResize,
  onResizeStart,
  onResizeEnd,
  onVisibilityChange,
  onPositionChange,
  onPositionChangeBegin,
  children,
  panelViews,
  attachedKeys,
  sidePanelCollapsed,
  setSidePanelCollapsed,
}) => {
  const headerRef = useRef<HTMLDivElement>();
  const panelRef = useRef<HTMLDivElement>();
  const resizerRef = useRef<HTMLDivElement>();
  const handlers = useRef({ onResize, onResizeStart, onResizeEnd, onPositionChange, onPositionChangeBegin, onVisibilityChange, onSnap });
  const [resizing, setResizing] = useState<string | undefined>();
  const keyRef = useRef(key);
  const collapsed = sidePanelCollapsed[alignment as Side];
  const isParentOfCollapsedPanel = attachedKeys && attachedKeys[0] === key;
  const collapsedHeader = !(collapsed && !isParentOfCollapsedPanel);
  const tooltipText = visible ? 'Collapse' : 'Expand';

  keyRef.current = key;

  const style = useMemo(() => {
    const dynamicStyle = visible ? {
      height: height ?? '100%',
      width: !collapsed ? width ?? '100%' : PANEL_HEADER_HEIGHT,
    } : {
      width: width ?? DEFAULT_PANEL_WIDTH,
      height: PANEL_HEADER_HEIGHT,
    };

    return {
      ...dynamicStyle,
      zIndex,
    };
  }, [width, height, visible, detached, expanded, zIndex, collapsed]);

  console.log('style', collapsed, style.width);
  const coordinates = useMemo(() => {
    return detached && !locked ? {
      top: `${relativeTop}%`,
      left: `${relativeLeft}%`,
    } : {};
  }, [detached, relativeTop, relativeLeft, locked]);

  const mods = useMemo(() => {
    return {
      detached: locked ? false : detached,
      resizing: isDefined(resizing),
      hidden: !visible,
      alignment: detached ? 'left' : alignment ?? 'left',
      disabled: locked,
      collapsed,
    };
  }, [alignment, visible, detached, resizing, locked]);

  useEffect(() => {
    Object.assign(handlers.current, {
      onResize,
      onResizeStart,
      onResizeEnd,
      onPositionChangeBegin,
      onPositionChange,
      onVisibilityChange,
      onSnap,
    });
  }, [onResize, onResizeStart, onResizeEnd, onPositionChange, onVisibilityChange, onPositionChangeBegin, onSnap]);

  // Panel positioning
  useDrag({
    elementRef: headerRef,
    disabled: locked,

    onMouseDown(e: any) {
      const el = e.target as HTMLElement;
      const collapseClassName = '[class*=__toggle]';

      if (el.matches(collapseClassName) || el.closest(collapseClassName) || collapsed) {
        return;
      }
      const allowDrag = true;
      const panel = panelRef.current!;
      const parentBBox = root.current!.getBoundingClientRect();
      const bbox = panel.getBoundingClientRect();
      const clickTarget = e.target?.getBoundingClientRect();
      const tx = e.clientX - clickTarget.left; //x position within the element.
      const ty = e.clientY - clickTarget.top; 

      const [x, y] = [e.pageX, e.pageY];
      const [oX, oY] = [
        bbox.left - parentBBox.left,
        bbox.top - parentBBox.top,
      ];
      
      const { current: key } = keyRef;
      const [nX, nY] = [x - tx, y - ty];

      handlers.current.onPositionChangeBegin?.(key, nX, nY, alignment, detached);

      return { x, y, oX, oY, allowDrag, alignment, key };
    },

    onMouseMove(e, data) {
      if (!data) return;
      const { x, y, oX, oY, key: draggingKey } = data;
      const [mX, mY] = [e.pageX, e.pageY];
      const dist = distance(x, mX, y, mY);

      if (dist < 30) return;
      const [nX, nY] = [oX + (mX - x), oY + (mY - y)];

      handlers.current.onPositionChange?.(draggingKey, nY, nX, true, alignment);
    },

    onMouseUp(_, data) {
      if (!data) return;
      const { key: draggingKey } = data;

      handlers.current.onSnap?.(draggingKey);
    },
  }, [detached, visible, locked, alignment, key]);

  // Panel resizing
  useDrag({
    elementRef: resizerRef,
    disabled: locked || positioning,
    capture: true,
    passive: true,

    onMouseDown(e) {
      const target = e.target as HTMLElement;
      const type = target.dataset.resize;
      const shift = (() => {
        switch(type) {
          case 'top-left':
            return 'top-left';
          case 'top':
          case 'top-right':
            return 'top';
          case 'left':
          case 'bottom-left':
            return 'left';
        }
      })();

      const resizeDirections = (() => {
        return {
          x: type?.match(/left|right/i) !== null,
          y: type?.match(/top|bottom/i) !== null,
        };
      })();

      setResizing(type);
      handlers.current.onResizeStart?.();

      return {
        pos: [e.pageX, e.pageY],
        type,
        width,
        maxWidth,
        height,
        top,
        left,
        resizeDirections,
        shift,
      };
    },
    onMouseMove(e, data) {
      if (data) {
        const {
          pos,
          width: w,
          height: h,
          maxWidth,
          top: t,
          left: l,
          resizeDirections,
          shift,
        } = data;

        const [sX, sY] = pos;

        const wMod = resizeDirections.x ? e.pageX - sX : 0;
        const hMod = resizeDirections.y ? e.pageY - sY : 0;

        const shiftLeft = isDefined(shift) && ['left', 'top-left'].includes(shift);
        const shiftTop = isDefined(shift) && ['top', 'top-left'].includes(shift);

        const width = clamp((shiftLeft ? w - wMod : w + wMod), DEFAULT_PANEL_WIDTH, maxWidth);
        const height = clamp((shiftTop ? h - hMod : h + hMod), DEFAULT_PANEL_HEIGHT, t + h);

        const top = shiftTop ? (t + (h - height)) : t;
        const left = shiftLeft ? (l + (w - width)) : l;
        const { current: key } = keyRef;

        handlers.current.onResize(
          key,
          width,
          height,
          top,
          left,
        );
      }
    },
    onMouseUp() {
      handlers.current.onResizeEnd?.();
      setResizing(undefined);
    },
  }, [handlers, detached, width, maxWidth, height, top, left, visible, locked, positioning]);

  const handleGroupPanelToggle = () => {
    setSidePanelCollapsed({ ...sidePanelCollapsed, [alignment]: !sidePanelCollapsed[alignment as Side] });
  };

  const handlePanelToggle = useCallback((e: RMouseEvent<HTMLOrSVGElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onVisibilityChange?.(key, !visible);
  }, [onVisibilityChange, key, visible]);

  return (
    <Block ref={panelRef} name="tabs-panel" mod={mods} style={{ ...style, ...coordinates }}>
      <Elem name="content">
        {!locked && collapsedHeader && (
          <Elem ref={headerRef} onClick={() => { if (collapsed) handleGroupPanelToggle(); }} id={key} mod={{ collapsed }} name="header">
            <Elem name="header-left" style={{ display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              {!collapsed && <Elem name="icon" style={{ pointerEvents: 'none' }} tag={IconOutlinerDrag} width={20} />}
              {!visible && !collapsed && <Elem name="title">{panelViews.map(view => view.title).join(' ')}</Elem>}
            </Elem>
            <Elem name="header-right" mod={{ detached }} style={{ display: 'flex', alignItems: 'center' }}>
              {visible && (
                <Elem name="toggle" onClick={handleGroupPanelToggle} data-tooltip={`${tooltipText} Group`}>
                  {Side.left === alignment ? <IconArrowLeft /> : <IconArrowRight />}
                </Elem>
              )}
              {!collapsed && (
                <Elem name="toggle" mod={{ detached }} onClick={handlePanelToggle} data-tooltip={tooltipText}>
                  {visible ? <IconOutlinerCollapse /> : <IconOutlinerExpand />}
                </Elem>
              )}
            </Elem>
          </Elem>
        )}
        {visible && !collapsed && (
          <Elem name="body" style={{ overflow: 'hidden' }}>
            {children}
          </Elem>
        )}
      </Elem>

      {visible && !positioning && !locked && (
        <Elem name="resizers" ref={resizerRef} mod={{ locked: positioning || locked }}>
          {resizers.map(res => {
            const shouldRender = ((res === 'left' || res === 'right') && alignment !== res) || detached || detached;

            return shouldRender ? (
              <Elem key={res} name="resizer" mod={{ drag: res === resizing }} data-resize={res} />
            ) : null;
          })}
        </Elem>
      )}
    </Block>
  );
};