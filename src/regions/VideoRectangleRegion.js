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
  .model("VideoRectangleRegionModel", {
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "videorectangleregion",
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

    getRectangle(frame) {
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
    updateRectangle(data, frame) {
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

    serialize() {
      const value = { sequence: self.sequence };

      if (self.labels?.length) value.labels = self.labels;

      return { value };
    },

    toggleLifespan(frame) {
      const keypoint = self.closestKeypoint(frame);

      if (keypoint) {
        const index = self.sequence.indexOf(keypoint);

        self.sequence = [
          ...self.sequence.slice(0, index),
          { ...keypoint, enabled: !keypoint.enabled },
          ...self.sequence.slice(index + 1),
        ];
      }
    },

    addKeypoint(frame) {
      const sequence = Array.from(self.sequence);
      const closestKeypoint = self.closestKeypoint(frame);

      sequence.push({
        ...(closestKeypoint ?? {
          x: 0,
          y: 0,
          enabled: true,
        }),
        frame,
        rotation: 0,
      });

      sequence.sort((a, b) => a.frame - b.frame);

      self.sequence = sequence;

      if (closestKeypoint) {
        self.updateRectangle({
          ...closestKeypoint,
          enabled: true,
        }, closestKeypoint.frame);
      }
    },

    removeKeypoint(frame) {
      self.sequence = self.sequence.filter(closestKeypoint => closestKeypoint.frame !== frame);
    },

    isInLifespan(targetFrame) {
      const closestKeypoint = self.closestKeypoint(targetFrame);

      if (closestKeypoint) {
        const { enabled, frame } = closestKeypoint;

        if (frame === targetFrame && !enabled) return true;
        return enabled;
      }
      return false;
    },

    closestKeypoint(targetFrame) {
      const keypoints = self.sequence.filter(k => k.frame <= targetFrame);

      return keypoints[keypoints.length - 1];
    },
  }));

const VideoRectangleRegionModel = types.compose(
  "VideoRectangleRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  Model,
);

Registry.addRegionType(VideoRectangleRegionModel, "video");

export { VideoRectangleRegionModel };
