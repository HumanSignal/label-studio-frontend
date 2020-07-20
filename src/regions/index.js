import { types } from "mobx-state-tree";

// export { default as Zoom } from "./Zoom";
// export { default as KeyPoint } from "./KeyPoint";

import { AudioRegionModel } from "./AudioRegion";
import { BrushRegionModel, HtxBrush } from "./BrushRegion";
import { HyperTextRegionModel } from "./HyperTextRegion";
import { KeyPointRegionModel, HtxKeyPoint } from "./KeyPointRegion";
import { GraphRegionModel, HtxGraph } from "./GraphRegion";
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
  GraphRegionModel,
  PolygonRegionModel,
  RectRegionModel,
  TextAreaRegionModel,
  TextRegionModel,
);

export {
  AllRegionsType,
  AudioRegionModel,
  BrushRegionModel,
  EllipseRegionModel,
  HtxBrush,
  HtxEllipse,
  HtxKeyPoint,
  HtxGraph,
  HtxPolygon,
  HtxRectangle,
  HtxTextAreaRegion,
  HyperTextRegionModel,
  KeyPointRegionModel,
  GraphRegionModel,
  PolygonPoint,
  PolygonPointView,
  PolygonRegionModel,
  RectRegionModel,
  TextAreaRegionModel,
  TextRegionModel,
};
