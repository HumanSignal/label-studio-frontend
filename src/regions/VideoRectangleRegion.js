import { types } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import WithStatesMixin from "../mixins/WithStates";
import Registry from "../core/Registry";
import { AreaMixin } from "../mixins/AreaMixin";
import { interpolateProp, onlyProps, VideoRegion } from "./VideoRegion";

const Model = types
  .model("VideoRectangleRegionModel", {
    type: "videorectangleregion",
  })
  .volatile(() => ({
    props: ["x", "y", "width", "height", "rotation"],
  }))
  .views(self => ({
    getShape(frame) {
      let prev, next;

      for (const item of self.sequence) {
        if (item.frame === frame) {
          return onlyProps(self.props, item);
        }

        if (item.frame > frame) {
          next = item;
          break;
        }
        prev = item;
      }

      if (!prev) return null;
      if (!next) return onlyProps(self.props, prev);

      return Object.fromEntries(self.props.map(prop => [
        prop,
        interpolateProp(prev, next, frame, prop),
      ]));
    },

    getVisibility() {
      return true;
    },
  }))
  .actions(self => ({
    updateShape(data, frame) {
      const newItem = {
        frame,
        enabled: true,
        rotation: 0,
        ...data,
      };
      const index = self.sequence.findIndex(item => item.frame >= frame);

      if (index < 0) {
        self.sequence = [...self.sequence, newItem];
      } else {
        const keypoint = self.sequence[index];

        self.sequence = [
          ...self.sequence.slice(0, index),
          ({ ...keypoint, ...newItem }),
          ...self.sequence.slice(index + (self.sequence[index].frame === frame)),
        ];
      }
    },
  }));

const VideoRectangleRegionModel = types.compose(
  "VideoRectangleRegionModel",
  WithStatesMixin,
  RegionsMixin,
  VideoRegion,
  AreaMixin,
  NormalizationMixin,
  Model,
);

Registry.addRegionType(VideoRectangleRegionModel, "video");

export { VideoRectangleRegionModel };
