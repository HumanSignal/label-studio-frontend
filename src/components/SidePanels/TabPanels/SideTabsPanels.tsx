import { observer } from 'mobx-react';
import { CSSProperties, FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Block, Elem } from '../../../utils/bem';
import { IconDetails } from '../../../assets/icons';
import { useMedia } from '../../../hooks/useMedia';
import ResizeObserver from '../../../utils/resize-observer';
import { clamp } from '../../../utils/utilities';
import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_MAX_WIDTH, DEFAULT_PANEL_WIDTH, PANEL_HEADER_HEIGHT } from '../constants';
import '../SidePanels.styl';
import { SidePanelsContext } from '../SidePanelsContext';
import { useRegionsCopyPaste } from '../../../hooks/useRegionsCopyPaste';
import { PanelTabsBase } from './PanelTabsBase';
import { Tabs } from './Tabs';
import { CommonProps, DroppableSide, emptyPanel, EventHandlers, PanelBBox, Result, SidePanelsProps } from './types';
import { renameKeys, restorePanel, savePanels, setActive, setActiveDefaults, stateAddedTab, stateRemovedTab, stateRemovePanelEmptyViews } from './utils';

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
  const [panelData, setPanelData] = useState<Record<string, PanelBBox>>(restorePanel());

  useRegionsCopyPaste(currentEntity);

  const sidePanelsCollapsed = useMemo(() => {
    return viewportSizeMatch || screenSizeMatch.matches;
  }, [viewportSizeMatch, screenSizeMatch.matches]);

  const updatePanel = useCallback((
    name: string,
    patch: Partial<PanelBBox>,
  ) => {
    setPanelData((state) => {
      const panel = { ...state[name], ...patch };
      const newState = {
        ...state,
        [name]: panel,
      };
      
      return newState;
    });
  }, [panelData]);
  
  const transferTab = useCallback((
    movingTab: number,
    movingPanel: string,
    receivingPanel: string,
    receivingTab: number,
    dropSide: DroppableSide,
  ) => {
    setPanelData((state) => {
      const movingTabComponent = state[movingPanel].panelViews[movingTab];

      if (movingTabComponent) movingTabComponent.active = true;
      const stateWithRemovals = stateRemovedTab(state, movingPanel, movingTab);
      const panelsWithRemovals = stateRemovePanelEmptyViews(stateWithRemovals); 
      const stateWithAdditions = stateAddedTab(panelsWithRemovals, receivingPanel, movingTabComponent, receivingTab, dropSide);
      const renamedKeys = renameKeys(stateWithAdditions);
      const activeDefaults = setActiveDefaults(renamedKeys);

      return activeDefaults;
    });
  }, [panelData]);

  const createNewPanel = useCallback((
    movingPanel: string,
    movingTab: number,
    left: number,
    top: number,
  ) => { 
    setPanelData((state) => {

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
        zIndex: 12,
      };
      
      movingTabComponent.active = true;
      const stateWithRemovals = stateRemovedTab(state, movingPanel, movingTab);

      Object.keys(stateWithRemovals).forEach(panelKey => stateWithRemovals[panelKey].zIndex = 10 );
      const panelsWithRemovals = stateRemovePanelEmptyViews(stateWithRemovals); 
      const panelWithAdditions = { ...panelsWithRemovals, [`${movingTabComponent.name}`]: newPanel };
      const renamedKeys = renameKeys(panelWithAdditions);
      const activeDefaults = setActiveDefaults(renamedKeys);
      

      return activeDefaults;
      
    });
  }, [panelData]);

  const setActiveTab = useCallback(
    (key: string, tabIndex: number) => setPanelData(state => setActive(state, key, tabIndex)),
    [panelData],
  );

  const onVisibilityChange = useCallback((key: string, visible: boolean) => {
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

  const normalizeOffsets = (key: string, top: number, left: number, visible?: boolean) => {
    const panel = panelData[key];
    const parentWidth = rootRef.current?.clientWidth ?? 0;
    const height = panel.detached
      ? (visible ?? panel.visible) ? panel.height : PANEL_HEADER_HEIGHT
      : panel.height;
    const normalizedLeft = clamp(left, 0, parentWidth - panel.width);
    const normalizedTop = clamp(top, 0, (rootRef.current?.clientHeight ?? 0) - height);

    return {
      left: normalizedLeft,
      top: normalizedTop,
    };
  };

  const onPositionChangeBegin = useCallback((key: string) => {
    Object.keys(panelData).forEach(panelKey => updatePanel(panelKey, { zIndex: panelKey === key ? 12 : 10 }));
    setPositioning(true);
  }, [panelData]);

  const onPositionChange = useCallback((key: string, t: number, l: number, detached: boolean) => { 
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
      .filter((panelName) => panelData[panelName as string]?.alignment === panelAlignment);
  }, [panelData]);


  const onResize = useCallback((key: string, w: number, h: number, t: number, l: number) => {
    const { left, top } = normalizeOffsets(key, t, l);
    const maxHeight = viewportSize.current.height - top;

    requestAnimationFrame(() => {
      const panelsOnSameAlignment = findPanelsOnSameSide(panelData[key]?.alignment);

      panelsOnSameAlignment.forEach(() => {
        updatePanel(key, {
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

  const onSnap = useCallback((key: string) => {
    setPositioning(false);

    if (!localSnap.current) return;
    const bboxData: Partial<PanelBBox> = {
      alignment: localSnap.current as DroppableSide,
      detached: false,
    };

    const sameSidePanels = findPanelsOnSameSide(localSnap.current).filter(panelName => panelName !== key);
    
    if(sameSidePanels.length > 0) {
      bboxData.width = clamp(panelData[sameSidePanels[0] as string]?.width, DEFAULT_PANEL_WIDTH, panelMaxWidth);
    } else updatePanel(key, bboxData);    
    
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
  }, [onResize, onResizeStart, onResizeEnd, onPositionChange, onVisibilityChange, onSnap, transferTab, createNewPanel, setActiveTab]);

  const commonProps: CommonProps = useMemo(() => {
    return {
      ...eventHandlers,
      root: rootRef,
      regions,
      selection: regions.selection,
      currentEntity,
    };
  }, [eventHandlers, regions, regions.selection, currentEntity]);

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

    const panels = Object.entries(panelData);

    for(const [name, panelData] of panels) {
      const { alignment, detached } = panelData;
      const props = {
        ...panelData,
        ...commonProps,
        name,
        top: panelData.storedTop ?? panelData.top,
        left: panelData.storedLeft ?? panelData.left,
        tooltip: panelData.panelViews.map(view => view.title).join(' '),
        icon: <IconDetails/>,
        positioning,
        maxWidth: panelMaxWidth,
        zIndex: panelData.zIndex,
        expanded: sidePanelsCollapsed,
        alignment: sidePanelsCollapsed ? DroppableSide.left : panelData.alignment,
        locked: sidePanelsCollapsed,
      };

      if (detached) result.detached.push(props);
      else if (alignment === 'left') result.left.push(props);
      else if (alignment === 'right') result.right.push(props);
    }
    return result;

  }, [panelData, commonProps, panelsHidden, sidePanelsCollapsed, positioning, panelMaxWidth]);

  useEffect(() => {
    if (Object.keys(panelData).length) savePanels(panelData);
  }, [panelData]);

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

  const newLabelingUI = true;

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
        mod={{ collapsed: sidePanelsCollapsed, newLabelingUI }}
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
                      <Tabs {...baseProps} /> 
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
