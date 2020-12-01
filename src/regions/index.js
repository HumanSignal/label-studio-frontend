import { types } from "mobx-state-tree";

// export { default as Zoom } from "./Zoom";
// export { default as KeyPoint } from "./KeyPoint";

import { AudioRegionModel } from "./AudioRegion";
import { BrushRegionModel, HtxBrush } from "./BrushRegion";
import { HyperTextRegionModel } from "./HyperTextRegion";
import { ParagraphsRegionModel } from "./ParagraphsRegion";
import { TimeSeriesRegionModel } from "./TimeSeriesRegion";
import { KeyPointRegionModel, HtxKeyPoint } from "./KeyPointRegion";
import { PolygonPoint, PolygonPointView } from "./PolygonPoint";
import { PolygonRegionModel, HtxPolygon } from "./PolygonRegion";
import { RectRegionModel, HtxRectangle } from "./RectRegion";
import { EllipseRegionModel, HtxEllipse } from "./EllipseRegion";
import { TextAreaRegionModel, HtxTextAreaRegion } from "./TextAreaRegion";
import { TextRegionModel } from "./TextRegion";

const AllRegionsType = types.union(
  AudioRegionModel,
  BrushRegionModel,
  EllipseRegionModel,
  HyperTextRegionModel,
  KeyPointRegionModel,
  PolygonRegionModel,
  RectRegionModel,
  TextAreaRegionModel,
  TextRegionModel,
  TimeSeriesRegionModel,
  ParagraphsRegionModel,
);

export {
  AllRegionsType,
  AudioRegionModel,
  BrushRegionModel,
  EllipseRegionModel,
  HtxBrush,
  HtxEllipse,
  HtxKeyPoint,
  HtxPolygon,
  HtxRectangle,
  HtxTextAreaRegion,
  HyperTextRegionModel,
  ParagraphsRegionModel,
  TimeSeriesRegionModel,
  KeyPointRegionModel,
  PolygonPoint,
  PolygonPointView,
  PolygonRegionModel,
  RectRegionModel,
  TextAreaRegionModel,
  TextRegionModel,
};
