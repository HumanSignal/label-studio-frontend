import chroma from "chroma-js";
import { observe } from "mobx";
import { useContext, useEffect, useMemo, useState } from "react";
import { ImageViewContext } from "../components/ImageView/ImageViewContext";
import Constants, { defaultStyle } from "../core/Constants";
import { isDefined } from "../utils/utilities";

const defaultStyles = {
  defaultOpacity: defaultStyle.opacity,
  defaultFillColor: defaultStyle.fillcolor,
  defaultStrokeColor: defaultStyle.strokecolor,
  defaultStrokeColorHighlighted: Constants.HIGHLIGHTED_STROKE_COLOR,
  defaultStrokeWidth: defaultStyle.strokewidth,
  defaultStrokeWidthHighlighted: Constants.HIGHLIGHTED_STROKE_WIDTH,
  defaultSuggestionWidth: Constants.SUGGESTION_STROKE_WIDTH,
};

export const useRegionStyles = (region, {
  includeFill = false,
  useStrokeAsFill = false,
  defaultOpacity = defaultStyle.opacity,
  defaultFillColor = defaultStyle.fillcolor,
  defaultStrokeColor = defaultStyle.strokecolor,
  defaultStrokeColorHighlighted = Constants.HIGHLIGHTED_STROKE_COLOR,
  defaultStrokeWidth = defaultStyle.strokewidth,
  defaultStrokeWidthHighlighted = Constants.HIGHLIGHTED_STROKE_WIDTH,
  defaultSuggestionWidth = Constants.SUGGESTION_STROKE_WIDTH,
} = defaultStyles) => {
  const style = region.style || region.tag;
  const { suggestion } = useContext(ImageViewContext) ?? {};
  const [highlighted, setHighlighted] = useState(region.highlighted);
  const [shouldFill, setShouldFill] = useState(region.fill ?? (useStrokeAsFill || includeFill));

  const selected = useMemo(() => {
    return region.inSelection || highlighted;
  }, [region.inSelection, highlighted]);

  const fillColor = useMemo(() => {
    // @todo fillopacity should be deprecated and will be removed in future
    const fillopacity = style?.fillopacity;
    const opacity = isDefined(fillopacity) ? fillopacity : style?.opacity;

    return shouldFill ? (
      chroma((useStrokeAsFill ? style?.strokecolor : style?.fillcolor) ?? defaultFillColor)
        .darken(0.3)
        .alpha(+(opacity ?? defaultOpacity ?? 0.5))
        .css()
    ) : null;
  }, [shouldFill, style, defaultFillColor, defaultOpacity]);

  const strokeColor = useMemo(() => {
    if (selected) {
      return defaultStrokeColorHighlighted;
    } else {
      return chroma(style?.strokecolor ?? defaultStrokeColor).css();
    }
  }, [selected, style, defaultStrokeColorHighlighted, defaultStrokeColor]);

  const strokeWidth = useMemo(() => {
    if (suggestion) {
      return defaultSuggestionWidth;
    } else if (selected) {
      return defaultStrokeWidthHighlighted;
    } else {
      return +(style?.strokewidth ?? defaultStrokeWidth);
    }
  }, [selected, style, defaultSuggestionWidth, defaultStrokeWidthHighlighted, defaultStrokeWidth]);

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
