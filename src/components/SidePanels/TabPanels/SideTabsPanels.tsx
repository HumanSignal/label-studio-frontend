import { observer } from 'mobx-react';
import { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Block, Elem } from '../../../utils/bem';
import { useMedia } from '../../../hooks/useMedia';
import ResizeObserver from '../../../utils/resize-observer';
import { clamp } from '../../../utils/utilities';
import { DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_MAX_HEIGHT, DEFAULT_PANEL_MAX_WIDTH, DEFAULT_PANEL_MIN_HEIGHT, DEFAULT_PANEL_WIDTH, PANEL_HEADER_HEIGHT } from '../constants';
import '../SidePanels.styl';
import { SidePanelsContext } from '../SidePanelsContext';
import { useRegionsCopyPaste } from '../../../hooks/useRegionsCopyPaste';
import { PanelTabsBase } from './PanelTabsBase';
import { Tabs } from './Tabs';
import { CommonProps, DropSide, EventHandlers, JoinOrder, PanelBBox, Result, Side, SidePanelsProps, ViewportSize } from './types';
import { getAttachedPerSide, getLeftKeys, getRightKeys, getSnappedHeights, joinPanelColumns, newPanelInState, partialEmptyBaseProps, renameKeys, resizePanelColumns, restorePanel, savePanels, setActive, setActiveDefaults, splitPanelColumns, stateAddedTab, stateRemovedTab, stateRemovePanelEmptyViews } from './utils';

const maxWindowWidth = 980;
const SideTabsPanelsComponent: FC<SidePanelsProps> = ({
  currentEntity,
  panelsHidden,
  children,
}) => {
  const snapThreshold = 5;
  const regions = currentEntity.regionStore;
  const viewportSize = useRef<ViewportSize>({ width: 0, height: 0 });
  const screenSizeMatch = useMedia(`screen and (max-width: ${maxWindowWidth}px)`);
  const [panelMaxWidth, setPanelMaxWidth] = useState(DEFAULT_PANEL_MAX_WIDTH);
  const [viewportSizeMatch, setViewportSizeMatch] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [positioning, setPositioning] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [collapsedSide, setCollapsedSide] = useState({ [Side.left]: false, [Side.right]: false });
  const rootRef = useRef<HTMLDivElement>();
  const [snap, setSnap] = useState<DropSide | Side | undefined>();
  const [panelData, setPanelData] = useState<Record<string, PanelBBox>>(restorePanel());
  const [breakPointActiveTab, setBreakPointActiveTab] = useState(0);
  const localSnap = useRef(snap);

  localSnap.current = snap;
  useRegionsCopyPaste(currentEntity);


  const panelBreakPoint = useMemo(() => {
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
    dropSide: Side,
  ) => {
    setPanelData((state) => {
      const movingTabComponent = state[movingPanel].panelViews[movingTab];

      if (movingTabComponent) movingTabComponent.active = true;
      const stateWithRemovals = stateRemovedTab(state, movingPanel, movingTab);
      const panelsWithRemovals = stateRemovePanelEmptyViews(stateWithRemovals); 
      const stateWithAdditions = stateAddedTab(panelsWithRemovals, receivingPanel, movingTabComponent, receivingTab, dropSide);
      const renamedKeys = renameKeys(stateWithAdditions);
      const activeDefaults = setActiveDefaults(renamedKeys);
      const restorePanelHeights = getSnappedHeights(activeDefaults, viewportSize.current.height);

      return restorePanelHeights;
    });
  }, [panelData]);

  const createNewPanel = useCallback((
    movingPanel: string,
    movingTab: number,
    left: number,
    top: number,
  ) => { 
    const name = { ...panelData[movingPanel].panelViews[movingTab] }.name;

    setPanelData((state) => {
      return newPanelInState(state, name, movingPanel, movingTab, left, top, viewportSize);    
    });
    localSnap.current &&
      setPanelData(state => {
        if (!localSnap.current) return state;
        const snapSide = localSnap.current.split('-');
        const side = snapSide[0] as Side;
        const joinOrder = snapSide[1] === 'top' ? JoinOrder.top : JoinOrder.bottom;
        const height = viewportSize.current.height;
        const joined = joinPanelColumns(state, name, side, DEFAULT_PANEL_WIDTH, height, joinOrder);

        setSnap(undefined);
        return joined;
      });

  }, [panelData]);

  const setActiveTab = useCallback(
    (key: string, tabIndex: number) => setPanelData(state => setActive(state, key, tabIndex)),
    [panelData],
  );

  const onVisibilityChange = useCallback((key: string, visible: boolean) => {
    setPanelData((state) => {
      const panel = panelData[key];
      const position = normalizeOffsets(key, panel.top, panel.left, visible);

      const newState = {
        ...state, [key]: {
          ...panel,
          visible, 
          storedTop: position.top / viewportSize.current.height * 100,
          storedLeft: position.left / viewportSize.current.width * 100,
        },
      };
      
      return getSnappedHeights(newState, viewportSize.current.height);
    });

  }, [setPanelData, panelData]);

  const checkSnap = useCallback((left: number, panelWidth: number, top: number, panelHeight: number) => {
    const right = left + panelWidth;
    const bottom = top + panelHeight;
    const parentWidth = viewportSize.current.width ?? 0;
    const parentHeight = viewportSize.current.height ?? 0;
    const targetRightWidth = Object.entries(panelData).find(([_, panelData]) => panelData.alignment === Side.right)?.[1].width || 0;
    const targetLeftWidth = Object.entries(panelData).find(([_, panelData]) => panelData.alignment === Side.left)?.[1].width || 0;
    const panelRightHit = right >= parentWidth - targetRightWidth;
    const panelLeftHit = left <= targetLeftWidth;
    const topHit = top <= snapThreshold;
    const bottomHit = bottom >= parentHeight - snapThreshold;
    let snap: DropSide | undefined = undefined;

    if (!collapsedSide[Side.left] && panelLeftHit) { 
      if (topHit) snap = DropSide.topLeft;
      if (bottomHit) snap = DropSide.bottomLeft;
      if (left <= snapThreshold) snap = DropSide.left;
    }
    if (!collapsedSide[Side.right] && panelRightHit) {
      if (topHit) snap = DropSide.topRight;
      if (bottomHit) snap = DropSide.bottomRight;
      if (right >= parentWidth - snapThreshold) snap = DropSide.right;
    }
    setSnap(snap);
  }, [panelData]);

  const normalizeOffsets = (key: string, top: number, left: number, visible?: boolean) => {
    const panel = panelData[key];
    const parentWidth = rootRef.current?.clientWidth ?? 0;
    let height = panel.detached
      ? (visible ?? panel.visible) ? panel.height : PANEL_HEADER_HEIGHT
      : panel.height;
    
    if (panel.height === rootRef.current?.clientHeight) height = DEFAULT_PANEL_HEIGHT;
      
    const normalizedLeft = clamp(left, 0, parentWidth - panel.width);
    const normalizedTop = clamp(top, 0, (rootRef.current?.clientHeight ?? 0) - height);

    return {
      left: normalizedLeft,
      top: normalizedTop || 1,
    };
  };

  const onPositionChangeBegin = useCallback((key: string) => {
    Object.keys(panelData).forEach(panelKey => updatePanel(panelKey, {
      zIndex: panelKey === key ? 12 : 10,
    }));
  }, [panelData]);

  const onPositionChange = useCallback((key: string, t: number, l: number, setDetached: boolean) => { 
    const panel = panelData[key];
    const { left, top } = normalizeOffsets(key, t, l, panel.visible);
    const maxHeight = viewportSize.current.height - top;

    if (!positioning && !panelData[key].detached) {
      setPositioning(true);
      setPanelData((state) => {
        return splitPanelColumns(state, key, viewportSize.current.height);
      });
    }

    checkSnap(left, panel.width, top, DEFAULT_PANEL_HEIGHT);
    requestAnimationFrame(() => {
      updatePanel(key, {
        top,
        left,
        relativeTop: top / viewportSize.current.height * 100,
        relativeLeft: left / viewportSize.current.width * 100,
        storedLeft: undefined,
        storedTop: undefined,
        detached: setDetached,
        maxHeight,
        alignment: setDetached ? undefined : panel.alignment,
      });
    });
  }, [updatePanel, checkSnap, panelData, positioning]);

  const onResizeStart = useCallback(() => { setResizing(() => true); }, []);
  const onResizeEnd = useCallback(() => { setResizing(() => false); }, []);

  const onGroupHeightResize = useCallback((key: string, h: number, t: number) => {
    setPanelData((state) => resizePanelColumns(state, key, h, t, viewportSize.current.height));
  }, [setPanelData]);

  const onResize = useCallback((key: string, w: number, h: number, t: number, l: number) => {
    const { left, top } = normalizeOffsets(key, t, l);
    const maxHeight = viewportSize.current.height - top;

    requestAnimationFrame(() => {
      const panelsOnSameAlignment = getAttachedPerSide(panelData, panelData[key]?.alignment);

      panelsOnSameAlignment && panelsOnSameAlignment.forEach((panelKey) => {
        const height = panelKey === key ? h : panelData[panelKey].height;
        
        updatePanel(panelKey, {
          top,
          left,
          relativeTop: (top / viewportSize.current.height) * 100,
          relativeLeft: (left / viewportSize.current.width) * 100,
          storedLeft: undefined,
          storedTop: undefined,
          maxHeight,
          width: clamp(w, DEFAULT_PANEL_WIDTH, panelMaxWidth),
          height: clamp(height, DEFAULT_PANEL_MIN_HEIGHT, DEFAULT_PANEL_MAX_HEIGHT),
        });
      });
    });
  }, [updatePanel, panelMaxWidth, panelData]);

  const onSnap = useCallback((key: string) => {
    setPositioning(false);
    if (!localSnap.current) return;
    const snap = localSnap.current.split('-');
    const side = snap[0] as Side;
    const joinOrder = snap[1] === 'top' ? JoinOrder.top : JoinOrder.bottom;
    const sameSidePanelKeys = getAttachedPerSide(panelData, side)?.filter(panelName => panelName !== key);

    if (sameSidePanelKeys && sameSidePanelKeys.length > 0) {
      setPanelData(state =>
        joinPanelColumns(
          state,
          key,
          side,
          DEFAULT_PANEL_WIDTH,
          viewportSize.current.height,
          joinOrder,
        ),
      );
    } else updatePanel(key, {
      height: viewportSize.current.height,
      alignment: side,
      detached: false,
    });
    
    setSnap(undefined);
  }, [updatePanel, panelData]);

  const eventHandlers: EventHandlers = useMemo(() => {
    return {
      onResize,
      onGroupHeightResize,
      onResizeStart,
      onResizeEnd,
      onPositionChange,
      onVisibilityChange,
      onPositionChangeBegin,
      onSnap,
      transferTab,
      createNewPanel,
      setActiveTab,
      checkSnap,
      setBreakPointActiveTab,
    };
  }, [onResize, onGroupHeightResize, onResizeStart, onResizeEnd, onPositionChange, onVisibilityChange, onSnap, transferTab, createNewPanel, setActiveTab]);

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
    const leftKeys = getLeftKeys(panelData);
    const rightKeys = getRightKeys(panelData);
    const allLeftNotVisible = leftKeys.every((key) => !panelData[key].visible);
    const allRightNotVisible = rightKeys.every((key) => !panelData[key].visible);
    const { left: leftCollapsed, right: rightCollapsed } = collapsedSide;

    const panelLeftWidth = leftKeys.length && panelData[leftKeys[0]].width || 0;
    const panelRightWidth = rightKeys.length && panelData[rightKeys[0]].width || 0;
    const visibilityLeft = allLeftNotVisible ? 0 : panelLeftWidth;
    const visibilityRight = allRightNotVisible ? 0 : panelRightWidth;
    const paddingLeft = panelBreakPoint ? 0 : leftCollapsed ?  PANEL_HEADER_HEIGHT : visibilityLeft ;
    const paddingRight = panelBreakPoint ? 0 :  rightCollapsed ? PANEL_HEADER_HEIGHT : visibilityRight;

    return ({
      paddingLeft,
      paddingRight,
    });
  }, [
    panelsHidden,
    panelData,
    collapsedSide,
    panelBreakPoint,
  ]);

  const panels = useMemo((): Result | Record<string, never> => {
    if (panelsHidden) return {};

    const result: Result = {
      detached: [],
      left: [],
      right: [],
    };

    const panels = Object.entries(panelData);

    for(const [name, panelDatum] of panels) {
      const { alignment, detached } = panelDatum;
      const attachedKeys = getAttachedPerSide(panelData, alignment);
      const props = {
        ...panelDatum,
        ...commonProps,
        name,
        top: panelDatum.storedTop ?? panelDatum.top,
        left: panelDatum.storedLeft ?? panelDatum.left,
        positioning,
        maxWidth: panelMaxWidth,
        zIndex: panelDatum.zIndex,
        expanded: collapsedSide[alignment],
        alignment: panelDatum.alignment,
        locked: panelBreakPoint,
        attachedKeys,
        sidePanelCollapsed: collapsedSide,
        setSidePanelCollapsed: setCollapsedSide,
        dragTop: alignment === Side.left ? snap === DropSide.topLeft : snap === DropSide.topRight,
        dragBottom: alignment === Side.left ? snap === DropSide.bottomLeft : snap === DropSide.bottomRight,
      };

      if (detached) result.detached.push(props);
      else if (alignment === 'left') result.left.push(props);
      else if (alignment === 'right') result.right.push(props);
    }
    return result;

  }, [panelData, commonProps, panelsHidden, positioning, panelMaxWidth, collapsedSide, snap]);

  useEffect(() => {
    if (Object.keys(panelData).length) savePanels(panelData);
  }, [panelData]);

  useEffect(() => {
    const root = rootRef.current!;
    const checkContentFit = () => {
      return (root.clientWidth ?? 0) < maxWindowWidth;
    };

    const observer = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = root ?? {};
      
      if(viewportSize.current.height !== clientHeight) setPanelData(getSnappedHeights(panelData, clientHeight));
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
      locked: panelBreakPoint,
    };
  }, []);

  const emptyBaseProps = { ...partialEmptyBaseProps,  ...commonProps, breakPointActiveTab, setBreakPointActiveTab };

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
        mod={{ collapsed: panelBreakPoint }}
        style={{ ...padding }}
      >
        {initialized && (
          <>
            <Elem name="content" mod={{ resizing: resizing || positioning }}>
              {children}
            </Elem>
            {panelsHidden !== true &&
              panelBreakPoint ? (
                <>
                  <Elem name="wrapper">
                    <PanelTabsBase { ...emptyBaseProps } >
                      <Tabs {...emptyBaseProps} />
                    </PanelTabsBase>
                  </Elem>
                </>
              ):(
                <>
                  {Object.entries(panels).map(([panelType, panels], iterator) => {              
                  
                    const content = panels.sort((a, b) => a.order - b.order).map((baseProps, index) => {
                      return (
                        <PanelTabsBase
                          key = {`${panelType}-${index}-${iterator}`} { ...baseProps } >
                          <Tabs {...baseProps} />
                        </PanelTabsBase>
                      );
                    });

                    if (panelType === 'detached') {
                      return <Fragment key={panelType}>{content}</Fragment>;
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