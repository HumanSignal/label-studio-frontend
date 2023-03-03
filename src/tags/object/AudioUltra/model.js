import { observe } from 'mobx';
import { getEnv, getRoot, getType, types } from 'mobx-state-tree';
import { customTypes } from '../../../core/CustomTypes';
import { guidGenerator, restoreNewsnapshot } from '../../../core/Helpers.ts';
import { AnnotationMixin } from '../../../mixins/AnnotationMixin';
import IsReadyMixin from '../../../mixins/IsReadyMixin';
import ProcessAttrsMixin from '../../../mixins/ProcessAttrs';
import { SyncMixin } from '../../../mixins/SyncMixin';
import { AudioRegionModel } from '../../../regions/AudioRegion';
import Utils from '../../../utils';
import { FF_DEV_2461, FF_LSDV_3028, isFF } from '../../../utils/feature-flags';
import { isDefined } from '../../../utils/utilities';
import { isTimeSimilar } from '../../../lib/AudioUltra';
import ObjectBase from '../Base';
import { WS_SPEED, WS_VOLUME, WS_ZOOM_X } from './constants';

/**
 * The Audio tag plays audio and shows its waveform. Use for audio annotation tasks where you want to label regions of audio, see the waveform, and manipulate audio during annotation.
 *
 * Use with the following data types: audio
 * @example
 * <!--Labeling configuration to label regions of audio and rate the audio sample-->
 * <View>
 *   <Labels name="lbl-1" toName="audio-1">
 *     <Label value="Guitar" />
 *     <Label value="Drums" />
 *   </Labels>
 *   <Rating name="rate-1" toName="audio-1" />
 *   <Audio name="audio-1" value="$audio" />
 * </View>
 * @name Audio
 * @meta_title Audio Tag for Audio Labeling
 * @meta_description Customize Label Studio with the Audio tag for advanced audio annotation tasks for machine learning and data science projects.
 * @param {string} name - Name of the element
 * @param {string} value - Data field containing path or a URL to the audio
 * @param {boolean=} [volume=false] - Whether to show a volume slider (from 0 to 1)
 * @param {string} [defaultvolume=1] - Default volume level (from 0 to 1)
 * @param {boolean} [speed=false] - Whether to show a speed slider (from 0.5 to 3)
 * @param {string} [defaultspeed=1] - Default speed level (from 0.5 to 2)
 * @param {boolean} [zoom=true] - Whether to show the zoom slider
 * @param {string} [defaultzoom=1] - Default zoom level (from 1 to 1500)
 * @param {string} [hotkey] - Hotkey used to play or pause audio
 * @param {string} [sync] object name to sync with
 * @param {string} [height=96] - Total height of the audio player
 * @param {string} [waveheight=32] - Minimum height of a waveform when in splitchannel mode with multiple channels
 * @param {string} [cursorwidth=1] - Audio pane cursor width. it's Measured in pixels.
 * @param {string} [cursorcolor=#333] - Audio pane cursor color. Color should be specify in hex decimal string
 * @param {string} [defaultscale=1] - Audio pane default y-scale for waveform
 * @param {boolean} [autocenter=true] – Always place cursor in the middle of the view
 * @param {boolean} [scrollparent=true] – Wave scroll smoothly follows the cursor
 * @param {boolean} [splitchannels=true] – Display stereo channels separately
 */
const TagAttrs = types.model({
  name: types.identifier,
  value: types.maybeNull(types.string),
  muted: types.optional(types.boolean, false),
  zoom: types.optional(types.boolean, true),
  defaultzoom: types.optional(types.string, WS_ZOOM_X.default.toString()),
  volume: types.optional(types.boolean, true),
  defaultvolume: types.optional(types.string, WS_VOLUME.default.toString()),
  speed: types.optional(types.boolean, true),
  defaultspeed: types.optional(types.string, WS_SPEED.default.toString()),
  hotkey: types.maybeNull(types.string),
  showlabels: types.optional(types.boolean, false),
  showscores: types.optional(types.boolean, false),
  height: types.optional(types.string, '96'),
  waveheight: types.optional(types.string, '32'),
  cursorwidth: types.optional(types.string, '2'),
  cursorcolor: types.optional(customTypes.color, '#333'),
  defaultscale: types.optional(types.string, '1'),
  autocenter: types.optional(types.boolean, true),
  scrollparent: types.optional(types.boolean, true),
  splitchannels: types.optional(types.boolean, isFF(FF_LSDV_3028)), // FF_LSDV_3028: true by default when on
});

export const AudioModel = types.compose(
  'AudioModel',
  TagAttrs,
  SyncMixin,
  ProcessAttrsMixin,
  ObjectBase,
  AnnotationMixin,
  IsReadyMixin,
  types.model('AudioModel', {
    type: 'audio',
    _value: types.optional(types.string, ''),
    regions: types.array(AudioRegionModel),
  })
    .volatile(() => ({
      errors: [],
    }))
    .views(self => ({
      get hasStates() {
        const states = self.states();

        return states && states.length > 0;
      },

      get store() {
        return getRoot(self);
      },

      get regs() {
        return self.annotation?.regionStore.regions.filter(r => r.object === self) || [];
      },

      states() {
        return self.annotation?.toNames.get(self.name) || [];
      },

      activeStates() {
        const states = self.states();

        return states && states.filter(s => getType(s).name === 'LabelsModel' && s.isSelected);
      },

      get activeState() {
        const states = self.states();

        return states && states.filter(s => getType(s).name === 'LabelsModel' && s.isSelected)[0];
      },

      get activeLabel() {
        const state = self.activeState;

        return state?.selectedValues()?.[0];
      },
    }))
    .actions(self => {
      let dispose;
      let updateTimeout = null;

      const Super = {
        triggerSyncPlay: self.triggerSyncPlay,
        triggerSyncPause: self.triggerSyncPause,
      };

      return {
        afterCreate() {
          dispose = observe(self, 'activeLabel', () => {
            const selectedRegions = self._ws?.regions?.selected;

            if (!selectedRegions || selectedRegions.length === 0) return;

            const activeState = self.activeState;
            const selectedColor = activeState?.selectedColor;
            const labels = activeState?.selectedValues();

            selectedRegions.forEach(r => {
              r.update({ color: selectedColor, labels: labels ?? [] });

              const region = r.isRegion ? self.updateRegion(r) : self.addRegion(r);

              self.annotation.selectArea(region);
            });

            if (selectedRegions.length) {
              self.requestWSUpdate();
            }
          }, false);
        },

        needsUpdate() {
          self.handleNewRegions();
          self.requestWSUpdate();
        },

        requestWSUpdate() {
          if (!self._ws) return;
          if (updateTimeout) {
            clearTimeout(updateTimeout);
          }

          updateTimeout = setTimeout(() => {
            self._ws.regions.redraw();
          }, 33);
        },

        onReady() {
          self.setReady(true);
        },

        onRateChange(rate) {
          self.triggerSyncSpeed(rate);
        },

        triggerSyncPlay() {
          if (self.syncedObject) {
            Super.triggerSyncPlay();
          } else {
            self.handleSyncPlay();
          }
        },

        triggerSyncPause() {
          if (self.syncedObject) {
            Super.triggerSyncPause();
          } else {
            self.handleSyncPause();
          }
        },

        handleSyncPlay() {
          if (!self._ws) return;
          if (self._ws.playing && self.isCurrentlyPlaying) return;

          self.isCurrentlyPlaying = true;
          self._ws?.play();
        },

        handleSyncPause() {
          if (!self._ws) return;
          if (!self._ws.playing && !self.isCurrentlyPlaying) return;

          self.isCurrentlyPlaying = false;
          self._ws?.pause();
        },

        handleSyncSpeed() {},
        handleSyncDuration() {},

        handleSyncSeek(time) {
          if (!self._ws?.loaded || isTimeSimilar(time, self._ws.currentTime)) return;

          try {
            self._ws.currentTime = time;
            self._ws.syncCursor(); // sync cursor with other tags
          } catch (err) {
            console.log(err);
          }
        },

        handleNewRegions() {
          if (!self._ws) return;

          self.regs.map(reg => {
            if (reg._ws_region) {
              self.updateWsRegion(reg);
            } else {
              self.createWsRegion(reg);
            }
          });
        },

        findRegionByWsRegion(wsRegion) {
          return self.regs.find(r => r._ws_region?.id === wsRegion?.id);
        },

        getRegionColor() {
          const control = self.activeState;

          if (control) {
            return control.selectedColor;
          }

          return null;
        },

        onHotKey(e) {
          e && e.preventDefault();
          self._ws.togglePlay();
          return false;
        },

        fromStateJSON(obj, fromModel) {
          let r;
          let m;

          const fm = self.annotation.names.get(obj.from_name);

          fm.fromStateJSON(obj);

          if (!fm.perregion && fromModel.type !== 'labels') return;

          const tree = {
            pid: obj.id,
            start: obj.value.start,
            end: obj.value.end,
            normalization: obj.normalization,
            score: obj.score,
            readonly: obj.readonly,
          };

          r = self.findRegion({ start: obj.value.start, end: obj.value.end });

          if (fromModel) {
            m = restoreNewsnapshot(fromModel);

            if (!r) {
              r = self.createRegion(tree, [m]);
            } else {
              r.states.push(m);
            }
          }

          if (self._ws) {
            self._ws.addRegion({
              start: r.start,
              end: r.end,
              color: r.getColor(),
            });
          }

          return r;
        },

        setRangeValue(val) {
          self.rangeValue = val;
        },

        setPlaybackRate(val) {
          self.playBackRate = val;
        },

        createRegion(wsRegion, states) {
          let bgColor = self.selectedregionbg;
          const st = states.find(s => s.type === 'labels');

          if (st) bgColor = Utils.Colors.convertToRGBA(st.getSelectedColor(), 0.3);

          const r = AudioRegionModel.create({
            id: wsRegion.id ? wsRegion.id : guidGenerator(),
            pid: wsRegion.pid ? wsRegion.pid : guidGenerator(),
            parentID: wsRegion.parent_id === null ? '' : wsRegion.parent_id,
            start: wsRegion.start,
            end: wsRegion.end,
            score: wsRegion.score,
            readonly: wsRegion.readonly,
            regionbg: self.regionbg,
            selectedregionbg: bgColor,
            normalization: wsRegion.normalization,
            states,
          });

          r._ws_region = wsRegion;

          self.regions.push(r);
          self.annotation.addRegion(r);

          return r;
        },

        addRegion(wsRegion) {
        // area id is assigned to WS region during deserealization
          const find_r = self.annotation.areas.get(wsRegion.id);


          if (find_r) {
            find_r._ws_region = wsRegion;
            find_r.updateColor();
            return find_r;
          }

          const states = self.getAvailableStates();

          if (states.length === 0) {
          // wsRegion.on("update-end", ev=> self.selectRange(ev, wsRegion));
            return;
          }

          const control = self.activeState;
          const labels = { [control.valueType]: control.selectedValues() };
          const r = self.annotation.createResult(wsRegion, labels, control, self);
          const updatedRegion = wsRegion.convertToRegion(labels.labels);

          r._ws_region = updatedRegion;
          r.updateColor();
          return r;
        },

        updateRegion(wsRegion) {
          const r = self.findRegionByWsRegion(wsRegion);

          if (!r) return;

          r.onUpdateEnd();
          return r;
        },

        /**
         * Play and stop
         */
        handlePlay() {
          if (self._ws) {
            self.isCurrentlyPlaying ? self.triggerSyncPlay() : self.triggerSyncPause();
          }
        },

        handleSeek() {
          if (!self._ws || (isFF(FF_DEV_2461) && self.syncedObject?.type === 'paragraphs')) return;

          self.triggerSyncSeek(self._ws.currentTime);
        },

        createWsRegion(region) {
          if (!self._ws) return;

          const options = region.wsRegionOptions();

          options.labels = region.labels?.length ? region.labels : undefined;

          const r = self._ws.addRegion(options, false);

          region._ws_region = r;
        },

        updateWsRegion(region) {
          if (!self._ws) return;

          const options = region.wsRegionOptions();

          options.labels = region.labels?.length ? region.labels : undefined;

          self._ws.updateRegion(options, false);
        },

        clearRegionMappings() {
          self.regs.forEach(r => {
            r._ws_region = null;
          });
        },

        onLoad(ws) {
          self.clearRegionMappings();
          self._ws = ws;

          self.setSyncedDuration(self._ws.duration);
          self.onReady();
          self.needsUpdate();
        },

        onSeek(time) {
          self.triggerSyncSeek(time);
        },

        onPlaying(playing) {
          if (playing) {
            self.triggerSyncPlay();
          } else {
            self.triggerSyncPause();
          }
        },

        onError(error) {
          let messageHandler;

          if (error.name === 'HTTPError') {
            messageHandler = 'ERR_LOADING_HTTP';
          } else {
            messageHandler = 'ERR_LOADING_AUDIO';
          }

          const message = getEnv(self.store).messages[messageHandler]({ attr: self.value, url: self._value, error: error.message });

          self.errors = [message];
        },

        beforeDestroy() {
          try {
            if (updateTimeout) clearTimeout(updateTimeout);
            if (dispose) dispose();
            if (isDefined(self._ws)) {
              self._ws.destroy();
              self._ws = null;
            }
          } catch (err) {
            self._ws = null;
            console.warn('Already destroyed');
          }
        },
      };
    }),
);
