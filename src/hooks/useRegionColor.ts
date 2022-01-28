import chroma from "chroma-js";
import { observe } from "mobx";
import { useContext, useEffect, useMemo, useState } from "react";
import { ImageViewContext } from "../components/ImageView/ImageViewContext";
import Constants, { defaultStyle } from "../core/Constants";

const defaultStyles = {
  defaultFillOpacity: defaultStyle.fillopacity,
  defaultFillColor: defaultStyle.fillcolor,
  defaultStrokeColor: defaultStyle.strokecolor,
  defaultStrokeColorHighlighted: Constants.HIGHLIGHTED_STROKE_COLOR,
  defaultStrokeWidth: defaultStyle.strokewidth,
  defaultStrokeWidthHighlighted: Constants.HIGHLIGHTED_STROKE_WIDTH,
  defaultSuggestionWidth: Constants.SUGGESTION_STROKE_WIDTH,
};

type StyleOptions = (typeof defaultStyles) & {
  suggestion?: boolean,
  includeFill?: boolean,
  useStrokeAsFill?: boolean,
}

export const getRegionStyles = (region: any, {
  includeFill = false,
  useStrokeAsFill = false,
  suggestion = false,
  defaultFillOpacity = defaultStyle.fillopacity,
  defaultFillColor = defaultStyle.fillcolor,
  defaultStrokeColor = defaultStyle.strokecolor,
  defaultStrokeColorHighlighted = Constants.HIGHLIGHTED_STROKE_COLOR,
  defaultStrokeWidth = defaultStyle.strokewidth,
  defaultStrokeWidthHighlighted = Constants.HIGHLIGHTED_STROKE_WIDTH,
  defaultSuggestionWidth = Constants.SUGGESTION_STROKE_WIDTH,
}: StyleOptions = defaultStyles) => {
  const style = region.style || region.tag;
  const [highlighted, setHighlighted] = useState(region.highlighted);
  const [shouldFill, setShouldFill] = useState(region.fill ?? (useStrokeAsFill || includeFill));

  const selected = useMemo(() => {
    return region.inSelection || highlighted;
  }, [region.inSelection, highlighted]);

  const fillColor = useMemo(() => {
    return shouldFill ? (
      chroma((useStrokeAsFill ? style?.strokecolor : style?.fillcolor) ?? defaultFillColor)
        .darken(0.3)
        .alpha(+(style?.fillopacity ?? defaultFillOpacity ?? 0.5))
        .css()
    ) : null;
  }, [shouldFill, style, defaultFillColor, defaultFillOpacity]);

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


export const useRegionStyles = (region: any, options?: StyleOptions) => {
  const { suggestion } = useContext(ImageViewContext) ?? {};
  const styles = getRegionStyles(region, {
    ...defaultStyles,
    ...(options ?? {}),
    suggestion,
  });

  return styles;
};
