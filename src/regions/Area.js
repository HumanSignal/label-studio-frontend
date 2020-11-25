import { types } from "mobx-state-tree";
import Registry from "../core/Registry";
import { RectRegionModel } from "./RectRegion";
import { KeyPointRegionModel } from "./KeyPointRegion";
import { AreaMixin } from "../mixins/AreaMixin";
import { AudioRegionModel } from "./AudioRegion";
import { TextRegionModel } from "./TextRegion";
import { HyperTextRegionModel } from "./HyperTextRegion";
import { PolygonRegionModel } from "./PolygonRegion";
import { EllipseRegionModel } from "./EllipseRegion";
import { BrushRegionModel } from "./BrushRegion";
import { TimeSeriesRegionModel } from "./TimeSeriesRegion";
import { ParagraphsRegionModel } from "./ParagraphsRegion";

// general Area type for classification Results which doesn't belong to any real Area
const ClassificationArea = types.compose(
  "ClassificationArea",
  AreaMixin,
  types
    .model({
      object: types.late(() => types.reference(types.union(...Registry.objectTypes()))),
      classification: true,
    })
    .actions(self => ({
      serialize: () => ({}),
    })),
);

const Area = types.union(
  {
    dispatcher(sn) {
      // for some deserializations
      if (sn.$treenode) return sn.$treenode.type;
      if (sn.value && Object.values(sn.value).length <= 1) return ClassificationArea;
      // may be a tag itself or just its name
      const objectName = sn.object.name || sn.object;
      // we have to use current config to detect Object tag by name
      const tag = window.Htx.completionStore.names.get(objectName);
      // provide value to detect Area by data
      const available = Registry.getAvailableAreas(tag.type, sn);
      // union of all available Areas for this Object type
      if (!available.length) return ClassificationArea;
      return types.union(...available, ClassificationArea);
    },
  },
  AudioRegionModel,
  TextRegionModel,
  HyperTextRegionModel,
  ParagraphsRegionModel,
  TimeSeriesRegionModel,
  RectRegionModel,
  KeyPointRegionModel,
  EllipseRegionModel,
  PolygonRegionModel,
  BrushRegionModel,
  ClassificationArea,
);

export default Area;
