import { observer } from 'mobx-react';
import { CSSProperties, FC, Fragment, MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { PanelTabsBase } from './PanelTabsBase';
import { Tabs } from './Tabs';
import { CommonProps, DroppableSide, emptyPanel, EventHandlers, PanelBBox, Result, SidePanelsProps } from './types';
import { stateAddedTab, stateRemovedTab } from './utils';

const maxWindowWidth = 980;


const SideTabsPanelsComponent: FC<SidePanelsProps> = ({
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
  const [panelData, setPanelData] = useState<PanelBBox[]>(
    [{
      top: 0,
      left: 0,
      relativeLeft: 0,
      relativeTop: 0,
      zIndex: 1,
      width: DEFAULT_PANEL_WIDTH,
      height: DEFAULT_PANEL_HEIGHT,
      visible: true,
      detached: false,
      alignment: DroppableSide.left,
      maxHeight: DEFAULT_PANEL_MAX_HEIGHT,
      panelViews: [{
        title: 'Outliner',
        component: OutlinerComponent as FC<PanelProps>,
        icon: IconHamburger,
        active: true,
      }],
    },
    {
      top: 0,
      left: 0,
      relativeLeft: 0,
      relativeTop: 0,
      zIndex: 1,
      width: DEFAULT_PANEL_WIDTH,
      height: DEFAULT_PANEL_HEIGHT,
      visible: true,
      detached: false,
      alignment: DroppableSide.right,
      maxHeight: DEFAULT_PANEL_MAX_HEIGHT,
      panelViews: [{
        title: 'Details',
        component: Details as FC<PanelProps>,
        icon: IconDetails,
        active: true,
      }],
    },
    ]);

  useRegionsCopyPaste(currentEntity);

  const sidePanelsCollapsed = useMemo(() => {
    return viewportSizeMatch || screenSizeMatch.matches;
  }, [viewportSizeMatch, screenSizeMatch.matches]);

  const updatePanel = useCallback((
    index: number,
    patch: Partial<PanelBBox>,
  ) => {
    setPanelData((state) => {
      const updatedPanel = state.map((panel, iterator) => (iterator === index ? { ...panel, ...patch } : panel));

      //todo: save panel data in local storage
      // savePanel(key, panel);

      return updatedPanel;
    });
  }, [panelData]);
  
  const transferTab = useCallback((
    movingTab: number,
    movingPanel: number,
    receivingPanel: number,
    receivingTab: number,
    dropSide: DroppableSide,
  ) => {
    console.log('transferTab', movingTab, movingPanel, receivingPanel, receivingTab, dropSide);
    setPanelData((state) => {
      const movingTabComponent = state[movingPanel].panelViews[movingTab];

      if (movingTabComponent) movingTabComponent.active = true;

      const stateWithRemovals = stateRemovedTab(state, movingPanel, movingTab);

      console.log('stateWithRemovals', stateWithRemovals); 
      const stateWithAdditions = stateAddedTab(stateWithRemovals, receivingPanel,  movingTabComponent, receivingTab, dropSide);
      const panelWithRemovals = stateWithAdditions.filter((panel) => panel.panelViews.length > 0); 

      //todo: save panel data in local storage
      // savePanel(key, panel);
      return panelWithRemovals;
    });
  }, [panelData]);

  const createNewPanel = useCallback((movingPanel, movingTab, left, top) => { 
    setPanelData((state) => {
      console.log('movingTabComponent', state[movingPanel]);

      const movingTabComponent = state[movingPanel].panelViews[movingTab];

      const newPanel = {
        ...emptyPanel,
        panelViews: [movingTabComponent],
        top,
        left,
        relativeTop: top / viewportSize.current.height * 100,
        relativeLeft: left / viewportSize.current.width * 100,
        visible: true,
        detached: true,
        zIndex: 2,
      };
      
      movingTabComponent.active = true;
      const stateWithRemovals = stateRemovedTab(state, movingPanel, movingTab);
      const panelsWithRemovals = stateWithRemovals.filter((panel) => panel.panelViews.length > 0); 
      const panelWithAdditions = [...panelsWithRemovals, newPanel];

      return  panelWithAdditions;
      
    });
  }, [panelData]);

  const setActiveTab = useCallback((index: number, tabIndex: number) => {
    console.log(index, tabIndex);
    setPanelData((state) =>
      state.map((panel, iterator) => {
        if (iterator === index) {
          panel.panelViews.forEach((tab, tabIterator) => {
            tab.active = tabIterator === tabIndex;
          });
        }

        return panel;
      }),
    );
  }, [panelData]);

  const onVisibilityChange = useCallback((index: number, visible: boolean) => {
    const panel = panelData[index];
    const position = normalizeOffsets(index, panel.top, panel.left, visible);

    updatePanel(index, {
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

  const normalizeOffsets = (index: number, top: number, left: number, visible?: boolean) => {
    const panel = panelData[index];
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

  const onPositionChangeBegin = useCallback((index: number) => {
    updatePanel(index, { zIndex: 1 });
    setPositioning(true);
  }, [panelData]);

  const onPositionChange = useCallback((index: number, t: number, l: number, detached: boolean) => { 
    console.log(index);
    const panel = panelData[index];
    const parentWidth = rootRef.current?.clientWidth ?? 0;

    const { left, top } = normalizeOffsets(index, t, l, panel.visible);
    const maxHeight = viewportSize.current.height - top;

    checkSnap(left, parentWidth, panel.width);

    requestAnimationFrame(() => {
      updatePanel(index, {
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
    return panelData.filter((panel) => panel.alignment === panelAlignment);
  }, [panelData]);

  const onResize = useCallback((index: number, w: number, h: number, t: number, l: number) => {
    const { left, top } = normalizeOffsets(index, t, l);
    const maxHeight = viewportSize.current.height - top;

    requestAnimationFrame(() => {
      const panelsOnSameAlignment = findPanelsOnSameSide(panelData[index]?.alignment);

      panelsOnSameAlignment.forEach(() => {
        updatePanel(index, {
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

  const onSnap = useCallback((index: number) => {
    setPositioning(false);

    if (!localSnap.current) return;
    const bboxData: Partial<PanelBBox> = {
      alignment: localSnap.current as DroppableSide,
      detached: false,
    };

    const firstPanelOnNewSideName = findPanelsOnSameSide(localSnap.current).filter(
      panel => panel.top !== panelData[index].top,
    )?.[0];

    if (firstPanelOnNewSideName) {
      bboxData.width = clamp(
        panelData[index]?.width,
        DEFAULT_PANEL_WIDTH,
        panelMaxWidth,
      );
    }
    
    updatePanel(index, bboxData);
    setSnap(undefined);
  }, [updatePanel]);

  const eventHandlers: EventHandlers = useMemo(() => {
    return {
      onResize,
      onResizeStart,
      onResizeEnd,
      onPositionChange,
      onVisibilityChange,
      onPositionChangeBegin,
      onSnap,
      transferTab,
      createNewPanel,
      setActiveTab,
    };
  }, [onResize, onResizeStart, onResizeEnd, onPositionChange, onVisibilityChange, onSnap, transferTab, createNewPanel, setActiveTab,]);

  const commonProps: CommonProps = useMemo(() => {
    return {
      ...eventHandlers,
      root: rootRef,
      regions,
      selection: regions.selection,
      currentEntity,
    };
  }, [eventHandlers, rootRef, regions, regions.selection, currentEntity]);

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

  const panels = useMemo((): Result | Record<string, never> => {
    if (panelsHidden) return {};

    const result: Result = {
      detached: [],
      left: [],
      right: [],
    };
    
    console.log('updatePanel');
    panelData.forEach((panelDatum, index) => {
      const { alignment, detached } = panelDatum;
      const props = {
        ...panelDatum,
        ...commonProps,
        index,
        top: panelDatum.storedTop ?? panelDatum.top,
        left: panelDatum.storedLeft ?? panelDatum.left,
        tooltip: panelDatum.panelViews?.find(view => view.active)?.title,
        icon: <IconDetails/>,
        positioning,
        maxWidth: panelMaxWidth,
        zIndex: panelDatum.zIndex,
        expanded: sidePanelsCollapsed,
        alignment: sidePanelsCollapsed ? DroppableSide.left : panelDatum.alignment,
        locked: sidePanelsCollapsed,
      };

      if (detached) result.detached.push(props);
      else if (alignment === 'left') result.left.push(props);
      else if (alignment === 'right') result.right.push(props);
    });

    return result;

  }, [panelData, commonProps, panelsHidden, sidePanelsCollapsed, positioning, panelMaxWidth]);

  useEffect(() => {
    localSnap.current = snap;
  }, [snap]);

  useEffect(() => {
    const root = rootRef.current!;
    const checkContentFit = () => {
      return (root.clientWidth ?? 0) < maxWindowWidth;
    };

    const observer = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = root ?? {};

      // Remember current width and height of the viewport
      viewportSize.current.width = clientWidth ?? 0;
      viewportSize.current.height = clientHeight ?? 0;

      setViewportSizeMatch(checkContentFit());
      setPanelMaxWidth(root.clientWidth * 0.4);
    });

    if (root) {
      observer.observe(root);
      setViewportSizeMatch(checkContentFit());
      setPanelMaxWidth(root.clientWidth * 0.4);
      setInitialized(true);
    }

    return () => {
      if (root) observer.unobserve(root);
      observer.disconnect();
    };
  }, []);

  const contextValue = useMemo(() => {
    return {
      locked: sidePanelsCollapsed,
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
                {Object.entries(panels).map(([panelType, panels], iterator) => {

                  const content = panels.map((baseProps, index) => (
                    <PanelTabsBase key={`${panelType}-${index}-${iterator}`} {...baseProps}>
                      <Tabs {...baseProps}> </Tabs>
                    </PanelTabsBase>
                  ));

                  if (panelType === 'detached') {
                    return  <Fragment key={panelType}>{content}</Fragment>;
                  }
                  return (
                    <Elem key={panelType} name="wrapper" mod={{ align: panelType, snap: snap === panelType }}>
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

export const SideTabsPanels = observer(SideTabsPanelsComponent);
