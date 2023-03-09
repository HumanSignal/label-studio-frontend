import { observer } from 'mobx-react';
import { CSSProperties, FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Block, Elem } from '../../utils/bem';
import { Details } from './DetailsPanel/DetailsPanel';
import { OutlinerComponent } from './OutlinerPanel/OutlinerPanel';

import { IconDetails, IconHamburger } from '../../assets/icons';
import { useMedia } from '../../hooks/useMedia';
import ResizeObserver from '../../utils/resize-observer';
import { clamp } from '../../utils/utilities';
import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_MAX_HEIGHT, DEFAULT_PANEL_MAX_WIDTH, DEFAULT_PANEL_WIDTH, PANEL_HEADER_HEIGHT, PANEL_HEADER_HEIGHT_PADDED } from './constants';
import { PanelProps } from './PanelBase';
import './SidePanels.styl';
import { SidePanelsContext } from './SidePanelsContext';
import { useRegionsCopyPaste } from '../../hooks/useRegionsCopyPaste';
import { PanelBase } from './PanelBase';

const maxWindowWidth = 980;

interface SidePanelsProps {
  panelsHidden: boolean;
  store: any;
  currentEntity: any;
}
export interface PanelView {
  title: string;
  component: FC<any>;
  icon: FC;
  active: boolean;
}
interface PanelBBox {
  width: number;
  height:  number;
  left: number;
  top: number;
  relativeLeft: number;
  relativeTop: number;
  storedTop?: number;
  storedLeft?: number;
  maxHeight: number;
  zIndex: number;
  visible: boolean;
  detached: boolean;
  alignment: 'left' | 'right';
  panelViews: PanelView[];
}


export type PanelType = string;

type PanelSize = Record<PanelType, PanelBBox>;

// const restorePanel = (name: PanelType, defaults: PanelBBox) => {
//   const panelData = window.localStorage.getItem(`panel:${name}`);

//   return panelData ? {
//     ...defaults,
//     ...JSON.parse(panelData),
//   } : defaults;
// };

const savePanel = (key: PanelType, panelData: PanelBBox) => {
  window.localStorage.setItem(`panel:${key}`, JSON.stringify(panelData));
};

// const panelView: Record<PanelType, PanelView> = {
//   '0': {
//     title: 'Outliner',
//     component: OutlinerPanel as FC<PanelProps>,
//     icon: IconHamburger,
//     active: true,
//   },
//   '1': {
//     title: 'Details',
//     component: DetailsPanel as FC<PanelProps>,
//     icon: IconDetails,
//     active: true,
//   },
// };

const SidePanelsComponent: FC<SidePanelsProps> = ({
  currentEntity,
  panelsHidden,
  children,
}) => {
  const snapThreshold = 5;
  const regions = currentEntity.regionStore;
  const viewportSize = useRef({ width: 0, height: 0 });
  const screenSizeMatch = useMedia(`screen and (max-width: ${maxWindowWidth}px)`);
  const [panelMaxWidth, setPanelMaxWidth] = useState(DEFAULT_PANEL_MAX_WIDTH);
  const [viewportSizeMatch, setViewportSizeMatch] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [positioning, setPositioning] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const rootRef = useRef<HTMLDivElement>();
  const [snap, setSnap] = useState<'left' | 'right' | undefined>();
  const localSnap = useRef(snap);
  const [panelData, setPanelData] = useState<PanelSize>({
    '0': {
      top: 0,
      left: 0,
      relativeLeft: 0,
      relativeTop: 0,
      zIndex: 1,
      width: DEFAULT_PANEL_WIDTH,
      height: DEFAULT_PANEL_HEIGHT,
      visible: true,
      detached: false,
      alignment: 'left',
      maxHeight: DEFAULT_PANEL_MAX_HEIGHT,
      panelViews: [{
        title: 'Outliner',
        component: OutlinerComponent as FC<PanelProps>,
        icon: IconHamburger,
        active: true,
      }],
    },
    '1': {
      top: 0,
      left: 0,
      relativeLeft: 0,
      relativeTop: 0,
      zIndex: 1,
      width: DEFAULT_PANEL_WIDTH,
      height: DEFAULT_PANEL_HEIGHT,
      visible: true,
      detached: false,
      alignment: 'right',
      maxHeight: DEFAULT_PANEL_MAX_HEIGHT,
      panelViews: [{
        title: 'Details',
        component: Details as FC<PanelProps>,
        icon: IconDetails,
        active: true,
      }],
    },
  });

  useRegionsCopyPaste(currentEntity);

  const sidePanelsCollapsed = useMemo(() => {
    return viewportSizeMatch || screenSizeMatch.matches;
  }, [viewportSizeMatch, screenSizeMatch.matches]);

  const updatePanel = useCallback((
    key: PanelType,
    patch: Partial<PanelBBox>,
  ) => {
    setPanelData((state) => {
      const panel = { ...state[key], ...patch };

      savePanel(key, panel);

      return {
        ...state,
        [key]: panel,
      };
    });
  }, [panelData]);

  const onVisibilityChange = useCallback((key: PanelType, visible: boolean) => {
    const panel = panelData[key];
    const position = normalizeOffsets(key, panel.top, panel.left, visible);

    updatePanel(key, {
      visible,
      storedTop: position.top / viewportSize.current.height * 100,
      storedLeft: position.left / viewportSize.current.width * 100,
    });
  }, [updatePanel]);


  const checkSnap = (left: number, parentWidth: number, panelWidth: number) => {
    const right = left + panelWidth;
    const rightLimit = parentWidth - snapThreshold;

    if (left >= 0 && left <= snapThreshold) {
      setSnap('left');
    } else if (right <= parentWidth && right >= rightLimit) {
      setSnap('right');
    } else {
      setSnap(undefined);
    }

  };

  const normalizeOffsets = (key: PanelType, top: number, left: number, visible?: boolean) => {
    const panel = panelData[key];
    const parentWidth = rootRef.current?.clientWidth ?? 0;
    const height = panel.detached
      ? (visible ?? panel.visible) ? panel.height : PANEL_HEADER_HEIGHT_PADDED
      : panel.height;
    const normalizedLeft = clamp(left, 0, parentWidth - panel.width);
    const normalizedTop = clamp(top, 0, (rootRef.current?.clientHeight ?? 0) - height);

    return {
      left: normalizedLeft,
      top: normalizedTop,
    };
  };

  const onPositionChangeBegin = useCallback((key: PanelType) => {
    const patch = Object.entries(panelData).reduce<PanelSize>((res, [panelName, panelData]) => {
      const panel = { ...panelData, zIndex: 1 };

      setPositioning(true);
      savePanel(panelName as PanelType, panel);
      return { ...res, [panelName]: panel };
    }, { ...panelData });

    patch[key] = {
      ...patch[key],
      zIndex: 15,
    };

    savePanel(key, patch[key]);
    setPanelData(patch);
  }, [panelData]);

  const onPositionChange = useCallback((key: PanelType, t: number, l:  number, detached: boolean) => {
    console.log('onPositionChange', key, t, l, detached);
    
    const panel = panelData[key];
    const parentWidth = rootRef.current?.clientWidth ?? 0;

    const { left, top } = normalizeOffsets(key, t, l, panel.visible);
    const maxHeight = viewportSize.current.height - top;

    checkSnap(left, parentWidth, panel.width);

    requestAnimationFrame(() => {
      updatePanel(key, {
        top,
        left,
        relativeTop: top / viewportSize.current.height * 100,
        relativeLeft: left / viewportSize.current.width * 100,
        storedLeft: undefined,
        storedTop: undefined,
        detached,
        maxHeight,
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

  const findPanelsOnSameSide = useCallback((panelAlignment : string) => {
    return Object.keys(panelData)
      .filter((key) => panelData[key as PanelType]?.alignment === panelAlignment);
  }, [panelData]);

  const onResize = useCallback((key: PanelType, w: number, h: number, t: number, l: number) => {
    const { left, top } = normalizeOffsets(key, t, l);
    const maxHeight = viewportSize.current.height - top;

    requestAnimationFrame(() => {
      const panelsOnSameAlignment = findPanelsOnSameSide(panelData[key]?.alignment);

      panelsOnSameAlignment.forEach(key => {
        updatePanel(key as PanelType, {
          top,
          left,
          relativeTop: (top / viewportSize.current.height) * 100,
          relativeLeft: (left / viewportSize.current.width) * 100,
          storedLeft: undefined,
          storedTop: undefined,
          maxHeight,
          width: clamp(w, DEFAULT_PANEL_WIDTH, panelMaxWidth),
          height: clamp(h, DEFAULT_PANEL_HEIGHT, maxHeight),
        });
      });
    });
  }, [updatePanel, panelMaxWidth, panelData]);

  const onSnap = useCallback((key: PanelType) => {
    setPositioning(false);

    if (!localSnap.current) return;
    const bboxData: Partial<PanelBBox> = {
      alignment: localSnap.current,
      detached: false,
    };

    const firstPanelOnNewSideName = findPanelsOnSameSide(localSnap.current).filter(
      panelName => panelName !== key,
    )?.[0];

    if (firstPanelOnNewSideName) {
      bboxData.width = clamp(
        panelData[firstPanelOnNewSideName as PanelType]?.width,
        DEFAULT_PANEL_WIDTH,
        panelMaxWidth,
      );
    }
    
    updatePanel(key, bboxData);
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

    if (sidePanelsCollapsed) {
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
    sidePanelsCollapsed,
  ]);

  const panels = useMemo(() => {
    if (panelsHidden) return {};

    const result: Record<string, {props: Record<string, any>}[]> = {
      detached: [],
      left: [],
      right: [],
    };

    const panels = Object.entries(panelData);

    for(const [, panelData] of panels) {
      const { alignment, detached } = panelData;
      // const views = panelData.panelViews;

      // const Component = view.component;
      // const Icon = view.icon;
      const props = {
        ...panelData,
        ...commonProps,
        top: panelData.storedTop ?? panelData.top,
        left: panelData.storedLeft ?? panelData.left,
        tooltip: panelData.panelViews?.find(view => view.active)?.title,
        icon: <IconDetails/>,
        positioning,
        maxWidth: panelMaxWidth,
        zIndex: panelData.zIndex,
        expanded: sidePanelsCollapsed,
        alignment: sidePanelsCollapsed ? 'left' : panelData.alignment,
        locked: sidePanelsCollapsed,
      };
      const panel = {
        props,
        // Component,
      };

      if (detached) result.detached.push(panel);
      else if (alignment === 'left') result.left.push(panel);
      else if (alignment === 'right') result.right.push(panel);
    }

    return result;
  }, [panelData, commonProps, panelsHidden, sidePanelsCollapsed, positioning, panelMaxWidth]);

  useEffect(() => {
    localSnap.current = snap;
  }, [snap]);

  useEffect(() => {
    const root = rootRef.current!;
    const checkContenFit = () => {
      return (root.clientWidth ?? 0) < maxWindowWidth;
    };

    const observer = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = root ?? {};

      // Remember current width and height of the viewport
      viewportSize.current.width = clientWidth ?? 0;
      viewportSize.current.height = clientHeight ?? 0;

      setViewportSizeMatch(checkContenFit());
      setPanelMaxWidth(root.clientWidth * 0.4);
    });

    if (root) {
      observer.observe(root);
      setViewportSizeMatch(checkContenFit());
      setPanelMaxWidth(root.clientWidth * 0.4);
      setInitialized(true);
    }

    return () => {
      if (root) observer.unobserve(root);
      observer.disconnect();
    };
  }, []);

  const updatePanelTabs = (panelKey: string, componentName: string ) => {
    console.log('updatePanelTabs', panelKey );
  };

  const contextValue = useMemo(() => {
    return {
      locked: sidePanelsCollapsed,
      updatePanelTabs,
    };
  }, [sidePanelsCollapsed]);

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
        mod={{ collapsed: sidePanelsCollapsed, newLabelingUI: true }}
      >
        {initialized && (
          <>
            <Elem name="content" mod={{ resizing: resizing || positioning }}>
              {children}
            </Elem>
            {panelsHidden !== true && (
              <>
                {Object.entries(panels).map(([key, panel]) => {

                  const content = panel.map((props, i) => {
                    console.log(props, key);

                    return <h1>hi</h1>;
                  });
                  // const Components = props.panelViews
                  // return (
                  // <PanelBase key={i} {...props}>
                  //   <Tabs > props.</Tabs>
                  // </PanelBase>
                  // ));
                  // const content = panel.map(({ props, Component }, i) => <Component key={i} {...props} />);

                  if (key === 'detached') {
                    return  <Fragment key={key}>{content}</Fragment>;
                  }

                  return (
                    <Elem key={key} name="wrapper" mod={{ align: key, snap: snap === key }}>
                      {content}
                    </Elem>
                  );
                })}
              </>
            )}
          </>
        )}
      </Block>
    </SidePanelsContext.Provider>
  );
};

export const SideTabPanels = observer(SidePanelsComponent);
