import { getRoot, types } from 'mobx-state-tree';
import React from 'react';

import { AnnotationMixin } from '../../../mixins/AnnotationMixin';
import ProcessAttrsMixin from '../../../mixins/ProcessAttrs';
import ObjectBase from '../Base';
import { SyncMixin } from '../../../mixins/SyncMixin';
import IsReadyMixin from '../../../mixins/IsReadyMixin';
import { isTimeRelativelySimilar } from '../../../lib/AudioUltra';
import { FF_DEV_2715, isFF } from '../../../utils/feature-flags';

const isFFDev2715 = isFF(FF_DEV_2715);

/**
 * Video tag plays a simple video file. Use for video annotation tasks such as classification and transcription.
 *
 * Use with the following data types: video
 * @example
 * <!--Labeling configuration to display a video on the labeling interface-->
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
 * @meta_title Video Tag for Video Labeling
 * @meta_description Customize Label Studio with the Video tag for basic video annotation tasks for machine learning and data science projects.
 * @param {string} name Name of the element
 * @param {string} value URL of the video
 * @param {number} [frameRate=24] videp frame rate per second; default is 24
 * @param {string} [sync] object name to sync with
 * @param {boolean} [muted=false] muted video
 * @param {number} [height=600] height of the video
 */

const TagAttrs = types.model({
  value: types.maybeNull(types.string),
  hotkey: types.maybeNull(types.string),
  framerate: types.optional(types.string, '24'),
  height: types.optional(types.string, '600'),
  muted: false,
});

const Model = types
  .model({
    type: 'video',
    _value: types.optional(types.string, ''),
    // special flag to store labels inside result, but under original type
    // @todo make it able to be disabled
    mergeLabelsAndResults: true,
  })
  .volatile(() => ({
    errors: [],
    speed: 1,
    ref: React.createRef(),
    frame: 1,
    length: 1,
  }))
  .views(self => ({
    get store() {
      return getRoot(self);
    },

    get regs() {
      return self.annotation?.regionStore.regions.filter(r => r.object === self) || [];
    },

    get currentFrame() {
      return self.ref.current?.position ?? 1;
    },

    control() {
      return self.annotation.toNames.get(self.name)?.find(s => !s.type.endsWith('labels'));
    },

    videoControl() {
      return self.annotation.toNames.get(self.name)?.find(s => s.type.includes('video'));
    },

    states() {
      return self.annotation.toNames.get(self.name)?.filter(s => s.type.endsWith('labels'));
    },

    activeStates() {
      const states = self.states();

      return states ? states.filter(c => c.isSelected === true) : null;
    },

    get hasStates() {
      const states = self.states();

      return states && states.length > 0;
    },
  }))
  .actions(self => {
    const Super = {
      triggerSyncPlay: self.triggerSyncPlay,
      triggerSyncPause: self.triggerSyncPause,
    };

    return {
      afterCreate() {
        const { framerate } = self;

        if (!framerate) self.framerate = 24;
        else if (framerate < 1) self.framerate = 1 / framerate;
      },

      triggerSyncPlay() {
        // Audio v3
        if (isFFDev2715) {
          if (self.syncedObject) {
            Super.triggerSyncPlay();
          } else {
            self.handleSyncPlay();
          }
        }
        // Audio v1,v2
        else {
          Super.triggerSyncPlay();
        }
      },

      triggerSyncPause() {
        // Audio v3
        if (isFFDev2715) {
          if (self.syncedObject) {
            Super.triggerSyncPause();
          } else {
            self.handleSyncPause();
          }
        }
        // Audio v1,v2
        else {
          Super.triggerSyncPause();
        }
      },

      handleSyncSeek(time) {
        // Audio v3
        if (isFFDev2715) {
          if (self.syncedDuration && time >= self.syncedDuration) {
            self.ref.current.currentTime = self.ref.current.duration;
          } else if (self.ref.current && !isTimeRelativelySimilar(self.ref.current.currentTime, time, self.ref.current.duration)) {
            self.ref.current.currentTime = time;
          }
        }
        // Audio v2,v1
        else {
          if (self.ref.current) {
            self.ref.current.currentTime = time;
          }
        }
      },

      handleSyncPlay() {
        // Audio v3
        if (isFFDev2715) {
          if (!self.isCurrentlyPlaying) {
            self.isCurrentlyPlaying = true;
            try {
              self.ref.current?.play();
            } catch {
              // do nothing, just ignore the DomException
              // just in case the video was in the midst of syncing
            }
          }
        }
        // Audio v2,v1
        else {
          self.ref.current?.play();
        }
      },

      handleSyncPause() {
        // Audio v3
        if (isFFDev2715) {
          if (self.isCurrentlyPlaying) {
            self.isCurrentlyPlaying = false;
            try {
              self.ref.current?.pause();
            } catch {
              // do nothing, just ignore the DomException
              // just in case the video was in the midst of syncing
            }
          }
        }
        // Audio v2,v1
        else {
          self.ref.current?.pause();
        }
      },

      handleSyncDuration(duration) {
        if (!isFFDev2715) return;
        if (self.ref.current) {
          self.setLength(duration * self.framerate);
        }
      },

      handleSyncSpeed(speed) {
        self.speed = speed;
      },

      handleSeek() {
        if (self.ref.current) {
          self.triggerSyncSeek(self.ref.current.currentTime);
        }
      },

      needsUpdate() {
        if (self.sync) {
          if (self.syncedObject?.type?.startsWith('audio')) {
            self.muted = true;
          }
        }
      },

      setLength(length) {
        self.length = length;
      },

      setOnlyFrame(frame) {
        if (self.frame !== frame) {
          self.frame = frame;
        }
      },

      setFrame(frame) {
        if (self.frame !== frame && self.framerate) {
          self.frame = frame;
          self.ref.current.currentTime = frame / self.framerate;
        }
      },

      addRegion(data) {
        const control = self.videoControl() ?? self.control();

        const sequence = [
          {
            frame: self.frame,
            enabled: true,
            rotation: 0,
            ...data,
          },
        ];

        if (!control) {
          console.error('NO CONTROL');
          return;
        }

        const area = self.annotation.createResult({ sequence }, {}, control, self);

        // add labels
        self.activeStates().forEach(state => {
          area.setValue(state);
        });

        return area;
      },

      deleteRegion(id) {
        self.findRegion(id)?.deleteRegion();
      },

      findRegion(id) {
        return self.regs.find(reg => reg.cleanId === id);
      },
    };
  });

export const VideoModel = types.compose('VideoModel',
  SyncMixin,
  TagAttrs,
  ProcessAttrsMixin,
  ObjectBase,
  AnnotationMixin,
  Model,
  IsReadyMixin,
);
