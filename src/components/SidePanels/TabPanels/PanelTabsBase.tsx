import { FC, MouseEvent as RMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Block, Elem } from '../../../utils/bem';
import { IconArrowLeft, IconArrowRight, IconOutlinerCollapse, IconOutlinerDrag, IconOutlinerExpand } from '../../../assets/icons';
import { useDrag } from '../../../hooks/useDrag';
import { clamp, isDefined } from '../../../utils/utilities';
import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_WIDTH, PANEL_HEADER_HEIGHT_PADDED } from '../constants';
import '../PanelBase.styl';
import { BaseProps } from './types';

export type PanelBaseExclusiveProps = 'name' | 'title'

const resizers = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'top',
  'bottom',
  'right',
  'left',
];

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
  tooltip,
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
}) => {
  const headerRef = useRef<HTMLDivElement>();
  const panelRef = useRef<HTMLDivElement>();
  const resizerRef = useRef<HTMLDivElement>();
  const handlers = useRef({ onResize, onResizeStart, onResizeEnd, onPositionChange, onPositionChangeBegin, onVisibilityChange, onSnap });
  const [resizing, setResizing] = useState<string | undefined>();
  const keyRef = useRef(key);

  keyRef.current = key;
  const handleCollapse = useCallback((e: RMouseEvent<HTMLOrSVGElement>) => {

    e.stopPropagation();
    e.preventDefault();
    onVisibilityChange?.(key, false);
  }, [onVisibilityChange, key]);

  const handleExpand = useCallback(() => {
    onVisibilityChange?.(key, true);
  }, [onVisibilityChange, key]);

  const style = useMemo(() => {
    const dynamicStyle = visible ? {
      height: detached ? height ?? '100%' : '100%',
      width: expanded ? '100%' : width ?? DEFAULT_PANEL_WIDTH,
    } : {
      width: detached ? width ?? DEFAULT_PANEL_WIDTH : '100%',
      height: detached ? PANEL_HEADER_HEIGHT_PADDED : undefined, // header height + 1px margin top and bottom,
    };

    return {
      ...dynamicStyle,
      zIndex,
    };
  }, [width, height, visible, detached, expanded, zIndex]);

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
      newLabelingUI: true,
    };
  }, [alignment, visible, detached, resizing, locked]);

  const currentIcon = useMemo(() => {
    if (detached) return visible ? <IconOutlinerCollapse/> : <IconOutlinerExpand/>;
    if (alignment === 'left') return visible ? <IconArrowLeft/> : <IconArrowRight/>;
    if (alignment === 'right') return visible ? <IconArrowRight/> : <IconArrowLeft/>;

    return null;
  }, [detached, visible, alignment]);

  const tooltipText = useMemo(() => {
    return `${visible ? 'Collapse' : 'Expand'} ${tooltip}`;
  }, [visible, tooltip]);

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
    disabled: locked || (!detached && !visible),

    onMouseDown(e) {
      const el = e.target as HTMLElement;
      const toggleClassName = '[class*=__toggle]';

      if (el.matches(toggleClassName) || el.closest(toggleClassName)) {
        return;
      }

      const allowDrag = detached;
      const panel = panelRef.current!;
      const parentBBox = root.current!.getBoundingClientRect();
      const bbox = panel.getBoundingClientRect();
      const [x, y] = [e.pageX, e.pageY];
      const [oX, oY] = [
        bbox.left - parentBBox.left,
        bbox.top - parentBBox.top,
      ];
      
      const { current: key } = keyRef;

      handlers.current.onPositionChangeBegin?.(key, top, left, detached);

      return { x, y, oX, oY, allowDrag };
    },

    onMouseMove(e, data) {
      if (data) {
        const { x, y, oX, oY } = data;
        let { allowDrag } = data;
        const [mX, mY] = [e.pageX, e.pageY];
        const dist = distance(x, mX, y, mY);

        if (dist > 30) {
          allowDrag = true;
        }

        if (!allowDrag) return;

        const [nX, nY] = [oX + (mX - x), oY + (mY - y)];
        const { current: key } = keyRef;

        handlers.current.onPositionChange?.(key, nY, nX, true);
      }
    },

    onMouseUp() {
      const { current: key } = keyRef;

      handlers.current.onSnap?.(key);
    },
  }, [detached, visible, locked]);

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

  return (
    <Block ref={panelRef} name="panel" mod={mods} style={{ ...style, ...coordinates }}>
      <Elem name="content">
        {!locked && (
          <Elem ref={headerRef} name="header" onClick={!detached ? handleExpand : undefined}>
            <Elem name="header-left" style={{ display: 'flex', alignItems: 'center' }}>
              {(visible || detached) && (
                <Elem name="icon" tag={IconOutlinerDrag} width={20} />
              )}
              {(!visible && panelViews.length > 1 && detached) && (
                <Elem name="title">{panelViews.map(view => view.title).join(' ')}</Elem>
              )}
            </Elem>

            <Elem
              name="toggle"
              mod={{ enabled: visible }}
              onClick={detached && !visible ? handleExpand : handleCollapse}
              data-tooltip={tooltipText}
            >
              {currentIcon}
            </Elem>
          </Elem>
        )}
        {visible && <Elem name="body">{children}</Elem>}
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