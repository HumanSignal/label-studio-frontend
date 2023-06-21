import { createRef } from 'react';
import { getRoot, types } from 'mobx-state-tree';
import ColorScheme from 'pleasejs';

import { errorBuilder } from '../../../core/DataValidator/ConfigValidator';
import { AnnotationMixin } from '../../../mixins/AnnotationMixin';
import RegionsMixin from '../../../mixins/Regions';
import { SyncableMixin } from '../../../mixins/Syncable';
import { SyncMixin } from '../../../mixins/SyncMixin';
import { ParagraphsRegionModel } from '../../../regions/ParagraphsRegion';
import Utils from '../../../utils';
import { parseValue } from '../../../utils/data';
import { FF_DEV_2461, FF_DEV_2669, FF_DEV_2918, FF_DEV_3666, FF_LSDV_3012, FF_LSDV_4711, isFF } from '../../../utils/feature-flags';
import messages from '../../../utils/messages';
import { clamp, isDefined, isValidObjectURL } from '../../../utils/utilities';
import ObjectBase from '../Base';
import styles from './Paragraphs.module.scss';

const isFFDev2461 = isFF(FF_DEV_2461);
const isFFLsdv4711 = isFF(FF_LSDV_4711);

/**
 * The `Paragraphs` tag displays paragraphs of text on the labeling interface. Use to label dialogue transcripts for NLP and NER projects.
 * The `Paragraphs` tag expects task data formatted as an array of objects like the following:
 * [{ $nameKey: "Author name", $textKey: "Text" }, ... ]
 *
 * Use with the following data types: text.
 * @example
 * <!--Labeling configuration to label paragraph regions of text containing dialogue-->
 * <View>
 *   <Paragraphs name="dialogue-1" value="$dialogue" layout="dialogue" />
 *   <ParagraphLabels name="importance" toName="dialogue-1">
 *     <Label value="Important content"></Label>
 *     <Label value="Random talk"></Label>
 *   </ParagraphLabels>
 * </View>
 * @name Paragraphs
 * @regions ParagraphsRegion
 * @meta_title Paragraph Tags for Paragraphs
 * @meta_description Customize Label Studio with the Paragraphs tag to annotate paragraphs for NLP and NER machine learning and data science projects.
 * @param {string} name                   - Name of the element
 * @param {string} value                  - Data field containing the paragraph content
 * @param {json|url} [valueType=json]     - Whether the data is stored directly in uploaded JSON data or needs to be loaded from a URL
 * @param {string} audioUrl               - Audio to sync phrases with
 * @param {string} [sync]                 - object name to sync with
 * @param {boolean} [showPlayer=false]    - Whether to show audio player above the paragraphs. Ignored if sync object is audio
 * @param {no|yes} [saveTextResult=yes]   - Whether to store labeled text along with the results. By default, doesn't store text for `valueType=url`
 * @param {none|dialogue} [layout=none]   - Whether to use a dialogue-style layout or not
 * @param {string} [nameKey=author]       - The key field to use for name
 * @param {string} [textKey=text]         - The key field to use for the text
 * @param {boolean} [contextScroll=false] - Turn on contextual scroll mode
 */
const TagAttrs = types.model('ParagraphsModel', {
  value: types.maybeNull(types.string),
  valuetype: types.optional(types.enumeration(['json', 'url']), () => (window.LS_SECURE_MODE ? 'url' : 'json')),
  audiourl: types.maybeNull(types.string),
  showplayer: false,

  highlightcolor: types.maybeNull(types.string),
  showlabels: types.optional(types.boolean, false),

  layout: types.optional(types.enumeration(['none', 'dialogue']), 'none'),

  // @todo add `valueType=url` to Paragraphs and make autodetection of `savetextresult`
  savetextresult: types.optional(types.enumeration(['none', 'no', 'yes']), () =>
    window.LS_SECURE_MODE ? 'no' : 'yes',
  ),

  namekey: types.optional(types.string, 'author'),
  textkey: types.optional(types.string, 'text'),
  contextscroll: types.optional(types.boolean, false),
});

const Model = types
  .model('ParagraphsModel', {
    type: 'paragraphs',
    _update: types.optional(types.number, 1),
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();

      return states && states.length > 0;
    },

    get store() {
      return getRoot(self);
    },

    get syncedAudioVideo() {
      if (!isFFDev2461) return false;
      return self.syncedObject?.type?.startsWith('audio') || self.syncedObject?.type?.startsWith('video');
    },

    get audio() {
      if (!self.audiourl) return null;
      if (self.audiourl[0] === '$') {
        const store = getRoot(self);
        const val = self.audiourl.substr(1);

        return store.task.dataObj[val];
      }
      return self.audiourl;
    },

    layoutStyles(data) {
      if (self.layout === 'dialogue') {
        const seed = data[self.namekey];

        return {
          phrase: { backgroundColor: Utils.Colors.convertToRGBA(ColorScheme.make_color({ seed })[0], 0.25) },
        };
      }

      return {};
    },

    get layoutClasses() {
      if (self.layout === 'dialogue') {
        return {
          phrase: styles.phrase,
          name: styles.dialoguename,
          text: styles.dialoguetext,
        };
      }

      return {
        phrase: styles.phrase,
        name: styles.name,
        text: styles.text,
      };
    },

    states() {
      return self.annotation.toNames.get(self.name);
    },

    activeStates() {
      const states = self.states();

      return states && states.filter(s => s.isSelected && s._type === 'paragraphlabels');
    },

    isVisibleForAuthorFilter(data) {
      if (!isFF(FF_DEV_2669)) return true;

      return !self.filterByAuthor.length || self.filterByAuthor.includes(data[self.namekey]);
    },
  }));

const PlayableAndSyncable = types.model()
  .volatile(() => ({
    _value: null,
    filterByAuthor: [],
    searchAuthor: '',
    playingId: -1,
    playing: false, // just internal state for UI
    audioRef: createRef(),
    audioDuration: null,
    audioStopHandler: null,
  }))
  .views(self => ({
    /**
     * All regions indices that are active at the given time.
     * @param {number} time
     * @returns {Array<number>}
     */
    regionIndicesByTime(time) {
      const indices = [];

      self._value?.forEach(({ start, duration, end }, idx) => {
        if (start === undefined) return false;
        if (start > time) return false;
        if (duration === undefined && end === undefined) indices.push(idx);
        else if ((end ?? start + duration) > time) indices.push(idx);
      });

      return indices;
    },
    /**
     * Returns regions start and end times.
     * Memoized and with no external dependencies, so will be computed only once.
     * @returns {Array<{start: number, end: number}>}
     */
    get regionsStartEnd() {
      if (!self.audioDuration) return [];

      return self._value?.map(value => {
        if (value.start === undefined) return {};

        const start = clamp(value.start ?? 0, 0, self.audioDuration);
        const _end = value.duration ? start + value.duration : (value.end ?? self.audioDuration);
        const end = clamp(_end, start, self.audioDuration);

        return { start, end };
      });
    },
  }))
  .actions(self => ({
    /**
     * Wrapper to always send important data during sync
     * @param {string} event
     * @param {object} data
     */
    triggerSync(event, data) {
      const audio = self.audioRef.current;

      if (!audio) return;

      self.syncSend({
        playing: !audio.paused,
        time: audio.currentTime,
        ...data,
      }, event);
    },

    registerSyncHandlers() {
      self.syncHandlers.set('pause', self.stopNow);
      self.syncHandlers.set('play', self.handleSyncPlay);
      self.syncHandlers.set('seek', self.handleSyncPlay);
      self.syncHandlers.set('speed', self.handleSyncSpeed);
    },

    handleSyncPlay({ time, playing }) {
      const audio = self.audioRef.current;
      const indices = self.regionIndicesByTime(time);

      if (!audio) return;
      // if we left current region's time, reset
      if (!indices.includes(self.playingId)) {
        self.stopNow();
        self.reset();
        return;
      }

      // so we are changing time inside current region only
      audio.currentTime = time;
      if (audio.paused && playing) {
        self.play(self.playingId);
      }
    },

    handleSyncSpeed({ speed }) {
      const audio = self.audioRef.current;

      if (audio) audio.playbackRate = speed;
    },

    syncMuted(muted) {
      const audio = self.audioRef.current;

      if (audio) audio.muted = muted;
    },
  }))
  .actions(self => ({
    handleAudioLoaded(e) {
      const audio = e.target;

      self.audioDuration = audio.duration;
    },

    reset() {
      self.playingId = -1;

      if (self.audioStopHandler) {
        cancelAnimationFrame(self.audioStopHandler);
        self.audioStopHandler = null;
      }
    },

    stopNow() {
      const audio = self.audioRef.current;

      if (!audio) return;
      if (audio.paused) return;

      audio.pause();
      self.playing = false;
      self.triggerSync('pause');
    },

    /**
     * Audio can be seeked to another time or speed can be changed,
     * so we need to check if we already reached the end of current region
     * and stop if needed.
     * Runs timer to check this every frame.
     */
    stopAtTheEnd() {
      const audio = self.audioRef.current;

      if (!audio) return;
      if (audio.paused) return;

      const { end } = self.regionsStartEnd[self.playingId] ?? {};

      if (audio.currentTime < end) {
        self.audioStopHandler = requestAnimationFrame(self.stopAtTheEnd);
        return;
      }

      self.stopNow();
      self.reset();
    },

    play(idx) {
      const { start, end } = self.regionsStartEnd[idx] ?? {};
      const audio = self.audioRef?.current;

      if (!isDefined(audio) || !isDefined(start) || !isDefined(end)) return;

      const isPlaying = !audio.paused;
      const currentId = self.playingId;

      if (isPlaying && currentId === idx) {
        self.stopNow();
        return;
      }

      if (idx !== currentId) {
        audio.currentTime = start;
      }

      audio.play();
      self.playing = true;
      self.playingId = idx;
      self.triggerSync('play');
      self.stopAtTheEnd();
    },
  }))
  .actions(self => ({
    setAuthorSearch(value) {
      self.searchAuthor = value;
    },

    setAuthorFilter(value) {
      self.filterByAuthor = value;
    },
  }));

const OldPlayAndSync = types.model()
  .volatile(() => ({
    _value: '',
    filterByAuthor: [],
    searchAuthor: '',
    playingId: -1,
  }))
  .actions(self => {
    const audioRef = createRef();
    let audioStopHandler = null;
    let endDuration = 0;
    let currentId = -1;
    let currentSourceTime = 0;
    let hasLoadedSource = false;
    let reloadingSource = false;
    let wasPlayingId = -1;

    function stop() {
      const audio = audioRef.current;

      if (!audio) return;

      const isPaused = isFFDev2461 ? !self.isCurrentlyPlaying : audio.paused;

      if (isPaused) return;

      const currentTime = audio.currentTime;

      if (currentTime < endDuration) {
        stopIn(endDuration - currentTime);
        return;
      }
      audioStopHandler = null;
      endDuration = 0;
      if (isFFDev2461) {
        self.handlePause();
      } else {
        audio.pause();
      }
      self.reset();
    }

    function stopIn(seconds) {
      audioStopHandler = window.setTimeout(stop, 1000 * seconds);
    }

    return {
      getRef() {
        return audioRef;
      },

      reset(hard = true) {
        self.playingId = -1;

        if (!isFFDev2461 || hard) {
          currentId = -1;
        }
      },

      handleError() {
        if (!isFFLsdv4711) return;

        const audio = audioRef.current;

        // if the source has succesfully loaded before, we can try to reload it
        // as it may be an expired presigned url or temporary network issue
        if (audio && hasLoadedSource) {
          hasLoadedSource = false;
          reloadingSource = true;
          wasPlayingId = self.playingId;
          currentSourceTime = isNaN(audio.currentTime) ? currentSourceTime : audio.currentTime;
          stop();
          audio.load();
        }
      },

      handleCanPlay() {
        if (!isFFLsdv4711) return;

        const audio = audioRef.current;

        hasLoadedSource = true;

        if (audio && reloadingSource) {
          reloadingSource = false;
          audio.currentTime = currentSourceTime;

          if (wasPlayingId > -1) self.play(wasPlayingId);
        }
      },

      handleSyncSeek(time) {
        if (audioRef.current) {
          currentSourceTime = time;
          audioRef.current.currentTime = time;
        }
      },

      handleSyncPlay() {
        self.isCurrentlyPlaying = true;
        self.muteSelfWhenSynced();

        if (audioRef.current) {
          audioRef.current.play();
        }
      },

      handleSyncPause() {
        self.isCurrentlyPlaying = false;
        self.reset(false);

        if (audioRef.current) {
          audioRef.current.pause();
        }
      },

      handleSyncSpeed(speed) {
        if (!audioRef.current) return;
        audioRef.current.playbackRate = speed;
      },

      handleSyncDuration() {},

      handlePause() {
        if (self.syncedAudioVideo) {
          self.triggerSyncPause();
        } else {
          self.handleSyncPause();
        }
      },

      handlePlay() {
        if (self.syncedAudioVideo) {
          self.triggerSyncPlay();
        } else {
          self.handleSyncPlay();
        }
      },

      handleSeek(time) {
        if (self.syncedAudioVideo) {
          self.triggerSyncSeek(time);
        } else {
          self.handleSyncSeek(time);
        }
      },

      muteSelfWhenSynced() {
        if (self.syncedAudioVideo && audioRef.current) {
          audioRef.current.muted = true;
        }
      },

      play(idx) {
        const value = self._value[idx] || {};
        const { start, duration } = value;
        const end = duration ? start + duration : value.end || 0;

        if (!audioRef || isNaN(start) || isNaN(end)) return;
        const audio = audioRef.current;

        if (audioStopHandler) {
          window.clearTimeout(audioStopHandler);
          audioStopHandler = null;
        }

        const isPlaying = isFFDev2461 ? self.isCurrentlyPlaying : !audio.paused;

        if (isPlaying && currentId === idx) {
          if (isFFDev2461) {
            self.handlePause();
          } else {
            audio.pause();
            self.playingId = -1;
          }
          return;
        }

        if (idx !== currentId) {
          if (isFFDev2461) {
            self.handleSeek(start);
          } else {
            audio.currentTime = start;
          }
        }

        if (isFFDev2461) {
          self.handlePlay();
        } else {
          audio.play();
        }

        endDuration = end;
        self.playingId = idx;
        currentId = idx;

        end && stopIn(end - start);
      },

      setAuthorSearch(value) {
        self.searchAuthor = value;
      },

      setAuthorFilter(value) {
        self.filterByAuthor = value;
      },
    };
  });

const ParagraphsLoadingModel = types.model()
  .actions(self => ({
    needsUpdate() {
      self._update = self._update + 1;
    },

    updateValue(store) {
      const value = parseValue(self.value, store.task.dataObj);

      if (self.valuetype === 'url') {
        const url = value;

        if (!isValidObjectURL(url, true)) {
          const message = [];

          if (url) {
            message.push(`URL (${url}) is not valid.`);
            message.push('You should not put data directly into your task if you use valuetype="url".');
          } else {
            message.push(`URL is empty, check ${value} in data JSON.`);
          }
          if (window.LS_SECURE_MODE) message.unshift('In SECURE MODE valuetype set to "url" by default.');
          store.annotationStore.addErrors([errorBuilder.generalError(message.join('\n'))]);
          self.setRemoteValue('');
          return;
        }
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return res.json();
          })
          .then(self.setRemoteValue)
          .catch(e => {
            const message = messages.ERR_LOADING_HTTP({ attr: self.value, error: String(e), url });

            store.annotationStore.addErrors([errorBuilder.generalError(message)]);
            self.setRemoteValue('');
          });
      } else {
        self.setRemoteValue(value);
      }
    },

    setRemoteValue(val) {
      const errors = [];

      if (!Array.isArray(val)) {
        errors.push('Provided data is not an array');
      } else {
        if (!(self.namekey in val[0])) {
          errors.push(`"${self.namekey}" field not found in task data; check your <b>nameKey</b> parameter`);
        }
        if (!(self.textkey in val[0])) {
          errors.push(`"${self.textkey}" field not found in task data; check your <b>textKey</b> parameter`);
        }
      }
      if (errors.length) {
        const general = [
          `Task data (provided as <b>${self.value}</b>) has wrong format.<br/>`,
          'It should be an array of objects with fields,',
          'defined by <b>nameKey</b> ("author" by default)',
          'and <b>textKey</b> ("text" by default)',
        ].join(' ');

        self.store.annotationStore.addErrors([
          errorBuilder.generalError(`${general}<ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul>`),
        ]);
        return;
      }
      self._value = val;
      self.needsUpdate();
    },

    createRegion(p) {
      const r = ParagraphsRegionModel.create({
        pid: p.id,
        ...p,
      });

      r._range = p._range;

      self.regions.push(r);
      self.annotation.addRegion(r);

      return r;
    },

    addRegions(ranges) {
      const areas = [];
      const states = isFF(FF_DEV_3666) ? self.getAvailableStates() : self.activeStates();

      if (states.length === 0) return;

      const control = states[0];
      const labels = { [control.valueType]: control.selectedValues() };

      for (const range of ranges) {
        const area = self.annotation.createResult(range, labels, control, self);

        if (getRoot(self).autoAnnotation) {
          area.makeDynamic();
        }

        area.setText(range.text);

        area.notifyDrawingFinished();

        area._range = range._range;
        areas.push(area);
      }
      return areas;
    },

    addRegion(range) {
      if (isFF(FF_DEV_2918)) {
        return self.addRegions([range])[0];
      } else {
        const states = isFF(FF_DEV_3666) ? self.getAvailableStates() : self.activeStates();

        if (states.length === 0) return;

        const control = states[0];
        const labels = { [control.valueType]: control.selectedValues() };
        const area = self.annotation.createResult(range, labels, control, self);

        if (getRoot(self).autoAnnotation) {
          area.makeDynamic();
        }

        area.setText(range.text);

        area.notifyDrawingFinished();

        area._range = range._range;
        return area;
      }
    },
  }));

const paragraphModelMixins = [
  RegionsMixin,
  TagAttrs,
  isFFDev2461 && !isFF(FF_LSDV_3012) && SyncMixin,
  isFF(FF_LSDV_3012) && SyncableMixin,
  ObjectBase,
  AnnotationMixin,
  Model,
  !isFF(FF_LSDV_3012) && OldPlayAndSync,
  isFF(FF_LSDV_3012) && PlayableAndSyncable,
  ParagraphsLoadingModel,
].filter(Boolean);

export const ParagraphsModel = types.compose('ParagraphsModel', ...paragraphModelMixins);
