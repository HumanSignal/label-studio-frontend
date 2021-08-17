import { types } from "mobx-state-tree";

// export { default as Zoom } from "./Zoom";
// export { default as KeyPoint } from "./KeyPoint";

import { AudioRegionModel } from "./AudioRegion";
import { BrushRegionModel, HtxBrush } from "./BrushRegion";
import { ParagraphsRegionModel } from "./ParagraphsRegion";
import { TimeSeriesRegionModel } from "./TimeSeriesRegion";
import { KeyPointRegionModel, HtxKeyPoint } from "./KeyPointRegion";
import { PolygonPoint, PolygonPointView } from "./PolygonPoint";
import { PolygonRegionModel, HtxPolygon } from "./PolygonRegion";
import { RectRegionModel, HtxRectangle } from "./RectRegion";
import { EllipseRegionModel, HtxEllipse } from "./EllipseRegion";
import { TextAreaRegionModel, HtxTextAreaRegion } from "./TextAreaRegion";
import { RichTextRegionModel } from "./RichTextRegion";

const AllRegionsType = types.union(
  AudioRegionModel,
  BrushRegionModel,
  EllipseRegionModel,
  TimeSeriesRegionModel,
  KeyPointRegionModel,
  PolygonRegionModel,
  RectRegionModel,
  TextAreaRegionModel,
  RichTextRegionModel,
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
  RichTextRegionModel,
  ParagraphsRegionModel,
  TimeSeriesRegionModel,
  KeyPointRegionModel,
  PolygonPoint,
  PolygonPointView,
  PolygonRegionModel,
  RectRegionModel,
  TextAreaRegionModel
};
