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
  visible: boolean;
  detached: boolean;
  alignment: "left" | "right";
}

interface PanelView<T extends PanelProps = PanelProps> {
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
    component: OutlinerPanel,
    icon: IconHamburger,
  },
  details: {
    component: DetailsPanel,
    icon: IconDetails,
  },
};

const SidePanelsComponent: FC<SidePanelsProps> = ({
  currentEntity,
  regions,
  panelsHidden,
  children,
}) => {
  const rootRef = useRef<HTMLDivElement>();
  const [snap, setSnap] = useState<"left" | "right" | undefined>();
  const localSnap = useRef(snap);
  const [panelData, setPanelData] = useState<PanelSize>({
    outliner: restorePanel("outliner", {
      top: 0,
      left: 0,
      width: 320,
      height: 400,
      visible: true,
      detached: false,
      alignment: "left",
    }),
    details: restorePanel("details", {
      top: 0,
      left: 0,
      width: 320,
      height: 400,
      visible: true,
      detached: false,
      alignment: "right",
    }),
  });

  const updatePanel = useCallback((name: PanelType, patch: Partial<PanelBBox>) => {
    const panel = { ...panelData[name], ...patch };

    savePanel(name, panel);

    setPanelData({
      ...panelData,
      [name]: panel,
    });
  }, [panelData]);

  const onVisibilityChange = useCallback((name: PanelType, visible: boolean) => {
    updatePanel(name, { visible });
  }, [updatePanel]);

  const onDetach = useCallback((name: PanelType, detached: boolean) => {
    updatePanel(name, { detached });
  }, [updatePanel]);

  const spaceFree = useCallback((alignment: "left" | "right") => {
    return Object.values(panelData).find(p => p.alignment === alignment && !p.detached) === undefined;
  }, [panelData]);

  const checkSnap = useCallback((left: number, parentWidth: number, panelWidth: number) => {
    const right = left + panelWidth;
    const rightLimit = parentWidth - 10;

    if (left >= 0 && left <= 10 && spaceFree('left')) {
      setSnap("left");
    } else if (right <= parentWidth && right >= rightLimit  && spaceFree('right')) {
      setSnap("right");
    } else {
      setSnap(undefined);
    }

  }, [spaceFree]);

  const normalizeOffsets = (name: PanelType, top: number, left: number) => {
    const panel = panelData[name];
    const parentWidth = rootRef.current?.clientWidth ?? 0;
    const normalizedLeft = clamp(left, 0, parentWidth - panel.width);
    const normalizedTop = clamp(top, 0, (rootRef.current?.clientHeight ?? 0) - panel.height);

    return { left: normalizedLeft, top: normalizedTop };
  };

  const onPositionChange = useCallback((name: PanelType, t: number, l:  number, detached: boolean) => {
    const panel = panelData[name];
    const parentWidth = rootRef.current?.clientWidth ?? 0;

    const { left, top } = normalizeOffsets(name, t, l);

    if (detached) checkSnap(left, parentWidth, panel.width);

    requestAnimationFrame(() => {
      updatePanel(name, { top, left, detached });
    });
  }, [updatePanel, checkSnap, panelData]);

  const onResize = useCallback((name: PanelType, w: number, h: number, t: number, l: number) => {
    const { left, top } = normalizeOffsets(name, t, l);

    requestAnimationFrame(() => {
      updatePanel(name, {
        width: clamp(w, 320, Infinity),
        height: clamp(h, 320, Infinity),
        top,
        left,
      });
    });
  }, [updatePanel]);

  const onSnap = useCallback((name: PanelType) => {
    if (!localSnap.current) return;

    updatePanel(name, {
      alignment: localSnap.current,
      detached: false,
    });
    setSnap(undefined);
  }, [updatePanel]);

  const eventHandlers = useMemo(() => {
    return {
      onDetach,
      onResize,
      onPositionChange,
      onVisibilityChange,
      onSnap,
    };
  }, [onDetach, onResize, onPositionChange, onVisibilityChange, onSnap]);

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

    return Object.values(panelData).reduce<CSSProperties>((res, data) => {
      const visible = !panelsHidden && !data.detached && data.visible;

      switch (data.alignment) {
        case "left": return { ...res, paddingLeft: visible ? data.width : 0 };
        case "right": return { ...res, paddingRight: visible ? data.width : 0 };
      }
    }, result);
  }, [
    panelsHidden,
    panelData,
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
      const props = { ...panelData, ...commonProps, icon: <Icon/> };
      const panel = {
        props,
        Component,
      };

      if (detached) result.detached.push(panel);
      else if (alignment === 'left') result.left.push(panel);
      else if (alignment === 'right') result.right.push(panel);
    }

    return result;
  }, [panelData, commonProps, panelsHidden]);

  useEffect(() => {
    localSnap.current = snap;
  }, [snap]);

  return (
    <Block ref={rootRef} name="sidepanels" style={{
      ...padding,
    }}>
      <Elem name="content">
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
  );
};

export const SidePanels = observer(SidePanelsComponent);
