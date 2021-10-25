import { types } from "mobx-state-tree";

import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import { VideoModel } from "../tags/object/Video";
import { guidGenerator } from "../core/Helpers";
import WithStatesMixin from "../mixins/WithStates";
import Registry from "../core/Registry";
import { AreaMixin } from "../mixins/AreaMixin";

function interpolateProp(start, end, frame, prop) {
  // @todo edge cases
  const r = (frame - start.frame) / (end.frame - start.frame);

  return start[prop] + (end[prop] - start[prop]) * r;
}

function onlyProps(props, obj) {
  return Object.fromEntries(props.map(prop => [
    prop,
    obj[prop],
  ]));
}

const Model = types
  .model("VideoBBoxRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "videobboxregion",
    object: types.late(() => types.reference(VideoModel)),

    sequence: types.frozen([]),
  })
  .volatile(() => ({
    hideable: true,
    props: ["x", "y", "width", "height", "rotation"],
  }))
  .views(self => ({
    get parent() {
      return self.object;
    },

    get annotation() {
      return self.object.annotation;
    },

    getBBox(frame) {
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
    updateBBox(data, frame) {
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
        const keyframe = self.sequence[index];

        self.sequence = [
          ...self.sequence.slice(0, index),
          ({ ...keyframe, ...newItem, enabled: keyframe.enabled }),
          ...self.sequence.slice(index + (self.sequence[index].frame === frame)),
        ];
      }
    },

    serialize() {
      return {
        value: {
          sequence: self.sequence,
        },
      };
    },

    isInLifespan(targetFrame) {
      const keyframes = self.sequence.filter(k => k.frame <= targetFrame);
      const closestKeyframe = keyframes[keyframes.length - 1];

      if (closestKeyframe) {
        const { enabled, frame } = closestKeyframe;

        if (frame === targetFrame && !enabled) return true;
        return enabled;
      }
      return false;
    },
  }));

const VideoBBoxRegionModel = types.compose(
  "VideoBBoxRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  Model,
);

Registry.addRegionType(VideoBBoxRegionModel, "video");

export { VideoBBoxRegionModel };
