import chroma from "chroma-js";
import { observe } from "mobx";
import { useEffect, useMemo, useState } from "react";
import Constants, { defaultStyle } from "../core/Constants";

export const useRegionColors = (region, {
  useStrokeAsFill = false,
} = {}) => {
  const style = region.style || region.tag || defaultStyle;
  const [highlighted, setHighlighted] = useState(region.highlighted);
  const [shouldFill, setShouldFill] = useState(region.fill ?? useStrokeAsFill);
  const selected = region.inSelection || highlighted;
  const fillColor = useMemo(() => {
    return shouldFill ? (
      chroma(useStrokeAsFill ? style.strokecolor : style.fillcolor)
        .darken(0.3)
        .alpha(+(style.fillopacity ?? 0.5))
        .css()
    ) : null;
  }, [shouldFill, style]);

  const strokeColor = useMemo(() => {
    if (selected) {
      return Constants.HIGHLIGHTED_STROKE_COLOR;
    } else {
      return chroma(style.strokecolor).css();
    }
  }, [selected, style]);

  const strokeWidth = useMemo(() => {
    if (selected) {
      return Constants.HIGHLIGHTED_STROKE_WIDTH;
    } else {
      return +style.strokewidth;
    }
  }, [selected, style]);

  useEffect(() => {
    const disposeObserver = [
      'highlighted',
      'fill',
    ].map(prop => {
      try {
        return observe(region, prop, ({ newValue }) => {
          switch(prop) {
            case 'highlighted': return setHighlighted(newValue);
            case 'fill': return setShouldFill(newValue);
          }
        }, true);
      } catch (e) {
        return () => {};
      }
    });

    return () => {
      disposeObserver.forEach(dispose => dispose());
    };
  }, [region]);

  return {
    strokeColor,
    fillColor,
    strokeWidth,
  };
};
