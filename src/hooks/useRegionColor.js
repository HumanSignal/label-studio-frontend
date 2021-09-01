import chroma from "chroma-js";
import { observe } from "mobx";
import { useContext, useEffect, useMemo, useState } from "react";
import { ImageViewContext } from "../components/ImageView/ImageViewContext";
import Constants, { defaultStyle } from "../core/Constants";

export const useRegionColors = (region, {
  useStrokeAsFill = false,
} = {}) => {
  const style = region.style || region.tag || defaultStyle;
  const { suggestion } = useContext(ImageViewContext) ?? {};
  const [highlighted, setHighlighted] = useState(region.highlighted);
  const [shouldFill, setShouldFill] = useState(region.fill ?? useStrokeAsFill);

  const fillColor = useMemo(() => {
    return shouldFill ? (
      chroma(useStrokeAsFill ? style.strokecolor : style.fillcolor)
        .darken(0.3)
        .alpha(+(style.fillopacity ?? 0.5))
        .css()
    ) : null;
  }, [shouldFill, style]);

  const strokeColor = useMemo(() => {
    if (highlighted) {
      return Constants.HIGHLIGHTED_STROKE_COLOR;
    } else {
      return chroma(style.strokecolor).css();
    }
  }, [highlighted, style]);

  const strokeWidth = useMemo(() => {
    if (suggestion) {
      return Constants.SUGGESTION_STROKE_WIDTH;
    } else if (highlighted) {
      return Constants.HIGHLIGHTED_STROKE_WIDTH;
    } else {
      return +style.strokewidth;
    }
  }, [highlighted, style]);

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
