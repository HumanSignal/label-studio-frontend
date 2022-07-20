import { CSSProperties, FC, Fragment, useCallback, useMemo, useRef, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { DetailsPanel } from "./DetailsPanel/DetailsPanel";
import { OutlinerPanel } from "./OutlinerPanel/OutlinerPanel";
import { observer } from "mobx-react";

import "./SidePanels.styl";
import { IconDetails, IconHamburger } from "../../assets/icons";
import { clamp } from "../../utils/utilities";
import { PanelProps } from "./PanelBase";
import { useEffect } from "react";
import { useMedia } from "../../hooks/useMedia";
import ResizeObserver from "../../utils/resize-observer";
import { SidePanelsContext } from "./SidePanelsContext";
import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_WIDTH, PANEL_HEADER_HEIGHT, PANEL_HEADER_HEIGHT_PADDED } from "./constants";

const maxWindowWidth = 980;

interface SidePanelsProps {
  panelsHidden: boolean;
  store: any;
  currentEntity: any;
  regions: any;
}

interface PanelBBox {
  width: number;
  height:  number;
  left: number;
  top: number;
  storedTop?: number;
  storedLeft?: number;
  zIndex: number;
  visible: boolean;
  detached: boolean;
  alignment: "left" | "right";
}

interface PanelView<T extends PanelProps = PanelProps> {
  title: string;
  component: FC<T>;
  icon: FC;
}

export type PanelType = "outliner" | "details";

type PanelSize = Record<PanelType, PanelBBox>;

const restorePanel = (name: PanelType, defaults: PanelBBox) => {
  const panelData = window.localStorage.getItem(`panel:${name}`);

  return panelData ? {
    ...defaults,
    ...JSON.parse(panelData),
  } : defaults;
};

const savePanel = (name: PanelType, panelData: PanelBBox) => {
  window.localStorage.setItem(`panel:${name}`, JSON.stringify(panelData));
};

const panelView: Record<PanelType, PanelView> = {
  outliner: {
    title: "Outliner",
    component: OutlinerPanel as FC<PanelProps>,
    icon: IconHamburger,
  },
  details: {
    title: "Details",
    component: DetailsPanel as FC<PanelProps>,
    icon: IconDetails,
  },
};

const SidePanelsComponent: FC<SidePanelsProps> = ({
  currentEntity,
  regions,
  panelsHidden,
  children,
}) => {
  const snapTreshold = 5;
  const screenSizeMatch = useMedia(`screen and (max-width: ${maxWindowWidth}px)`);
  const [viewportSizeMatch, setViewportSizeMatch] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [positioning, setPositioning] = useState(false);
  const rootRef = useRef<HTMLDivElement>();
  const [snap, setSnap] = useState<"left" | "right" | undefined>();
  const localSnap = useRef(snap);
  const [panelData, setPanelData] = useState<PanelSize>({
    outliner: restorePanel("outliner", {
      top: 0,
      left: 0,
      zIndex: 1,
      width: DEFAULT_PANEL_WIDTH,
      height: DEFAULT_PANEL_HEIGHT,
      visible: true,
      detached: false,
      alignment: "left",
    }),
    details: restorePanel("details", {
      top: 0,
      left: 0,
      zIndex: 1,
      width: DEFAULT_PANEL_WIDTH,
      height: DEFAULT_PANEL_HEIGHT,
      visible: true,
      detached: false,
      alignment: "right",
    }),
  });

  const sidepanelsCollapsed = useMemo(() => {
    return viewportSizeMatch || screenSizeMatch.matches;
  }, [viewportSizeMatch, screenSizeMatch.matches]);

  const updatePanel = useCallback((
    name: PanelType,
    patch: Partial<PanelBBox>,
  ) => {
    setPanelData((state) => {
      const panel = { ...state[name], ...patch };

      savePanel(name, panel);

      return {
        ...state,
        [name]: panel,
      };
    });
  }, [panelData]);

  const onVisibilityChange = useCallback((name: PanelType, visible: boolean) => {
    const panel = panelData[name];
    const position = normalizeOffsets(name, panel.top, panel.left, visible);

    updatePanel(name, {
      visible,
      storedTop: position.top,
      storedLeft: position.left,
    });
  }, [updatePanel]);

  const spaceFree = useCallback((alignment: "left" | "right") => {
    return Object.values(panelData).find(p => p.alignment === alignment && !p.detached) === undefined;
  }, [panelData]);

  const checkSnap = useCallback((left: number, parentWidth: number, panelWidth: number) => {
    const right = left + panelWidth;
    const rightLimit = parentWidth - snapTreshold;

    if (left >= 0 && left <= snapTreshold && spaceFree('left')) {
      setSnap("left");
    } else if (right <= parentWidth && right >= rightLimit  && spaceFree('right')) {
      setSnap("right");
    } else {
      setSnap(undefined);
    }

  }, [spaceFree]);

  const normalizeOffsets = (name: PanelType, top: number, left: number, visible?: boolean) => {
    const panel = panelData[name];
    const parentWidth = rootRef.current?.clientWidth ?? 0;
    const height = panel.detached
      ? (visible ?? panel.visible) ? panel.height : PANEL_HEADER_HEIGHT_PADDED
      : panel.height;
    const normalizedLeft = clamp(left, 0, parentWidth - panel.width);
    const normalizedTop = clamp(top, 0, (rootRef.current?.clientHeight ?? 0) - height);

    return { left: normalizedLeft, top: normalizedTop };
  };

  const onPositionChangeBegin = useCallback((name: PanelType) => {
    const patch = Object.entries(panelData).reduce<PanelSize>((res, [panelName, panelData]) => {
      const panel = { ...panelData, zIndex: 1 };

      setPositioning(true);
      savePanel(panelName as PanelType, panel);
      return { ...res, [panelName]: panel };
    }, { ...panelData });

    patch[name] = {
      ...patch[name],
      zIndex: 15,
    };

    savePanel(name, patch[name]);
    setPanelData(patch);
  }, [panelData]);

  const onPositionChange = useCallback((name: PanelType, t: number, l:  number, detached: boolean) => {
    const panel = panelData[name];
    const parentWidth = rootRef.current?.clientWidth ?? 0;

    const { left, top } = normalizeOffsets(name, t, l, panel.visible);

    checkSnap(left, parentWidth, panel.width);

    requestAnimationFrame(() => {
      updatePanel(name, {
        top,
        left,
        storedLeft: undefined,
        storedTop: undefined,
        detached,
        alignment: detached ? undefined : panel.alignment,
      });
    });
  }, [updatePanel, checkSnap, panelData]);

  const onResizeStart = useCallback(() => {
    setResizing(() => true);
  }, []);

  const onResizeEnd = useCallback(() => {
    setResizing(() => false);
  }, []);

  const onResize = useCallback((name: PanelType, w: number, h: number, t: number, l: number) => {
    const { left, top } = normalizeOffsets(name, t, l);

    requestAnimationFrame(() => {
      updatePanel(name, {
        top,
        left,
        storedLeft: undefined,
        storedTop: undefined,
        width: clamp(w, DEFAULT_PANEL_WIDTH, Infinity),
        height: clamp(h, DEFAULT_PANEL_WIDTH, Infinity),
      });
    });
  }, [updatePanel]);

  const onSnap = useCallback((name: PanelType) => {
    setPositioning(false);

    if (!localSnap.current) return;

    updatePanel(name, {
      alignment: localSnap.current,
      detached: false,
    });
    setSnap(undefined);
  }, [updatePanel]);

  const eventHandlers = useMemo(() => {
    return {
      onResize,
      onResizeStart,
      onResizeEnd,
      onPositionChange,
      onVisibilityChange,
      onPositionChangeBegin,
      onSnap,
    };
  }, [onResize, onResizeStart, onResizeEnd, onPositionChange, onVisibilityChange, onSnap]);

  const commonProps = useMemo(() => {
    return {
      ...eventHandlers,
      root: rootRef,
      regions,
      selection: regions.selection,
      currentEntity,
    };
  }, [eventHandlers, rootRef, regions, regions.selectio, currentEntity]);

  const padding = useMemo(() => {
    const result = {
      paddingLeft: 0,
      paddingRight: 0,
    };

    if (sidepanelsCollapsed) {
      return result;
    }

    return Object.values(panelData).reduce<CSSProperties>((res, data) => {
      const visible = !panelsHidden && !data.detached && data.visible;
      const padding = visible ? data.width : PANEL_HEADER_HEIGHT;
      const paddingProperty = data.alignment === 'left' ? 'paddingLeft' : 'paddingRight';

      return (!data.detached) ? {
        ...res,
        [paddingProperty]: padding,
      } : res;
    }, result);
  }, [
    panelsHidden,
    panelData,
    sidepanelsCollapsed,
  ]);

  const panels = useMemo(() => {
    if (panelsHidden) return {};

    const result: Record<string, {props: Record<string, any>, Component: FC<any>}[]> = {
      detached: [],
      left: [],
      right: [],
    };

    const panels = Object.entries(panelData);

    for(const [name, panelData] of panels) {
      const { alignment, detached } = panelData;
      const view = panelView[name as PanelType];
      const Component = view.component;
      const Icon = view.icon;
      const props = {
        ...panelData,
        ...commonProps,
        top: panelData.storedTop ?? panelData.top,
        left: panelData.storedLeft ?? panelData.left,
        tooltip: view.title,
        icon: <Icon/>,
        positioning,
        zIndex: panelData.zIndex,
        expanded: sidepanelsCollapsed,
        alignment: sidepanelsCollapsed ? "left" : panelData.alignment,
        locked: sidepanelsCollapsed,
      };
      const panel = {
        props,
        Component,
      };

      if (detached) result.detached.push(panel);
      else if (alignment === 'left') result.left.push(panel);
      else if (alignment === 'right') result.right.push(panel);
    }

    return result;
  }, [panelData, commonProps, panelsHidden, sidepanelsCollapsed, positioning]);

  useEffect(() => {
    localSnap.current = snap;
  }, [snap]);

  useEffect(() => {
    const root = rootRef.current!;
    const observer = new ResizeObserver(() => {
      const matches = (rootRef.current?.clientWidth ?? 0) < maxWindowWidth;

      setViewportSizeMatch(matches);
    });

    if (root) observer.observe(root);

    return () => {
      if (root) observer.unobserve(root);
      observer.disconnect();
    };
  }, []);

  const contextValue = useMemo(() => {
    return {
      locked: sidepanelsCollapsed,
    };
  }, [sidepanelsCollapsed]);

  return (
    <SidePanelsContext.Provider value={contextValue}>
      <Block
        ref={(el: HTMLDivElement | null) => {
          if (el) {
            rootRef.current = el;
            setViewportSizeMatch(el.clientWidth <= maxWindowWidth);
          }
        }}
        name="sidepanels"
        style={{
          ...padding,
        }}
        mod={{ collapsed: sidepanelsCollapsed }}
      >
        <Elem name="content" mod={{ resizing: resizing || positioning }}>
          {children}
        </Elem>
        {panelsHidden !== true && (
          <>
            {Object.entries(panels).map(([key, panel]) => {
              const content = panel.map(({ props, Component }, i) => <Component key={i} {...props} />);

              if (key === 'detached') {
                return <Fragment key={key}>{content}</Fragment>;
              }

              return (
                <Elem key={key} name="wrapper" mod={{ align: key, snap: snap === key }}>
                  {content}
                </Elem>
              );
            })}
          </>
        )}
      </Block>
    </SidePanelsContext.Provider>
  );
};

export const SidePanels = observer(SidePanelsComponent);
