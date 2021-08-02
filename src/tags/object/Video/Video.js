import { types } from "mobx-state-tree";
import React from "react";

import { AnnotationMixin } from "../../../mixins/AnnotationMixin";
import ProcessAttrsMixin from "../../../mixins/ProcessAttrs";
import ObjectBase from "../Base";

/**
 * Video tag plays a simple video file.
 * @example
 * <View>
 *   <Video name="video" value="$video" />
 * </View>
 * @example
 * <!-- Video classification -->
 * <View>
 *   <Video name="video" value="$video" />
 *   <Choices name="ch" toName="video">
 *     <Choice value="Positive" />
 *     <Choice value="Negative" />
 *   </Choices>
 * </View>
 * @example
 * <!-- Video transcription -->
 * <View>
 *   <Video name="video" value="$video" />
 *   <TextArea name="ta" toName="video" />
 * </View>
 * @name Video
 * @param {string} name Name of the element
 * @param {string} value URL of the video
 * @param {number} [frameRate=0.04] frame rate in seconds; default 1/25s
 */

const TagAttrs = types.model({
  name: types.identifier,
  value: types.maybeNull(types.string),
  hotkey: types.maybeNull(types.string),
  framerate: types.optional(types.string, "0.04"),
});

const Model = types
  .model({
    type: "video",
    _value: types.optional(types.string, ""),
  })
  .volatile(self => ({
    errors: [],
    ref: React.createRef(),
  }));

export const VideoModel = types.compose("VideoModel", Model, TagAttrs, ProcessAttrsMixin, ObjectBase, AnnotationMixin);
