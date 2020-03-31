import React, { Fragment } from "react";
import { observer, inject } from "mobx-react";
import { types, getRoot, getType } from "mobx-state-tree";

import AudioControls from "./Audio/Controls";
import ObjectTag from "../../components/Tags/Object";
import ObjectBase from "./Base";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Utils from "../../utils";
import Waveform from "../../components/Waveform/Waveform";
import styles from "./AudioPlus/AudioPlus.module.scss"; // eslint-disable-line no-unused-vars
import { AudioRegionModel } from "../../regions/AudioRegion";
import { cloneNode } from "../../core/Helpers";
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";

/**
 * AudioPlus tag plays audio and shows its wave
 * @example
 * <View>
 *   <Labels name="lbl-1" toName="audio-1">
 *     <Label value="Hello" />
 *     <Label value="World" />
 *   </Labels>
 *   <Rating name="rate-1" toName="audio-1" />
 *   <AudioPlus name="audio-1" value="$audio" />
 * </View>
 * @name AudioPlus
 * @param {string} name - name of the element
 * @param {string} value - value of the element
 * @param {boolean=} [volume=false] - show the volume slider (from 0 to 1)
 * @param {boolean} [speed=false] - show the speed slider (from 0.5 to 3)
 * @param {boolean} [zoom=true] - show the zoom slider
 * @param {string} [hotkey] - hotkey used to play/pause audio
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  value: types.maybeNull(types.string),
  zoom: types.optional(types.boolean, true),
  volume: types.optional(types.boolean, true),
  speed: types.optional(types.boolean, true),
  regs: types.optional(types.boolean, true),
  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model("AudioPlusModel", {
    id: types.identifier,
    type: "audio",
    _value: types.optional(types.string, ""),

    showlabels: types.optional(types.boolean, false),
    showscores: types.optional(types.boolean, false),

    playing: types.optional(types.boolean, false),
    regions: types.array(AudioRegionModel),
    height: types.optional(types.string, "128"),
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();
      return states && states.length > 0;
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },

    states() {
      return self.completion.toNames.get(self.name);
    },

    activeStates() {
      const states = self.states();
      return states && states.filter(s => getType(s).name === "LabelsModel" && s.isSelected);
    },

    activePerRegionStates() {
      const states = self.states();
      return states && states.filter(s => s.perregion === true);
    },
  }))
  .actions(self => ({
    toStateJSON() {
      return self.regions.map(r => r.toStateJSON());
    },

    onHotKey() {
      return self._ws.playPause();
    },

    /**
     * Find region of audio
     */
    findRegion(start, end) {
      let findedRegion = self.regions.find(r => r.start === start && r.end === end);
      return findedRegion;
    },

    fromStateJSON(obj, fromModel) {
      let r;
      let m;

      const fm = self.completion.names.get(obj.from_name);
      fm.fromStateJSON(obj);

      if (!fm.perregion && fromModel.type !== "labels") return;

      // if (obj.value.choices) {
      //     fm.fromStateJSON(obj);
      //     if (! fm.perregion) return;

      //   // return;
      // }

      // if (obj.value.text) {
      //     fm.fromStateJSON(obj);
      // }

      // if (obj.value.labels) {
      //   fm.fromStateJSON(obj);
      // }

      /**
       *
       */
      const tree = {
        pid: obj.id,
        start: obj.value.start,
        end: obj.value.end,
        normalization: obj.normalization,
        score: obj.score,
        readonly: obj.readonly,
      };

      r = self.findRegion(obj.value.start, obj.value.end);

      if (fromModel) {
        m = restoreNewsnapshot(fromModel);
        // m.fromStateJSON(obj);

        if (!r) {
          // tree.states = [m];
          r = self.createRegion(tree, [m]);
          // r = self.addRegion(tree);
        } else {
          r.states.push(m);
        }
      }

      if (self._ws) {
        self._ws.addRegion({
          start: r.start,
          end: r.end,
        });
      }

      // if (fm.perregion)
      //     fm.perRegionCleanup();

      r.updateAppearenceFromState();

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
      const st = states.find(s => s.type === "labels");
      if (st) bgColor = Utils.Colors.convertToRGBA(st.getSelectedColor(), 0.3);

      const r = AudioRegionModel.create({
        id: wsRegion.id ? wsRegion.id : guidGenerator(),
        pid: wsRegion.pid ? wsRegion.pid : guidGenerator(),
        start: wsRegion.start,
        end: wsRegion.end,
        score: wsRegion.score,
        readonly: wsRegion.readonly,
        regionbg: self.regionbg,
        selectedregionbg: bgColor,
        normalization: wsRegion.normalization,
        states: states,
      });

      r._ws_region = wsRegion;

      self.regions.push(r);
      self.completion.addRegion(r);

      return r;
    },

    addRegion(ws_region) {
      const states = self.activeStates();
      // if (! states || states.length === 0) {
      //   ws_region.remove();
      //   return;
      // }

      const allStates = states; // states.concat(self.activePerRegionStates());
      const clonedStates = allStates.map(s => cloneNode(s));

      const find_r = self.findRegion(ws_region.start, ws_region.end);

      if (self.findRegion(ws_region.start, ws_region.end)) {
        find_r.applyCSSClass(ws_region);

        find_r._ws_region = ws_region;
        return find_r;
      }

      if (clonedStates.length == 0) {
        ws_region.remove && ws_region.remove();
        return;
      }

      const r = self.createRegion(ws_region, clonedStates);
      r.applyCSSClass(ws_region);

      return r;
    },

    /**
     * Play and stop
     */
    handlePlay() {
      self.playing = !self.playing;
    },

    onLoad(ws) {
      self._ws = ws;

      self.regions.forEach(obj => {
        let opts = {};
        if (obj.readonly)
          opts = {
            drag: false,
            resize: false,
          };

        self._ws.addRegion({
          start: obj.start,
          end: obj.end,
          ...opts,
        });
      });
    },

    wsCreated(ws) {
      self._ws = ws;
    },
  }));

const AudioPlusModel = types.compose("AudioPlusModel", TagAttrs, Model, ProcessAttrsMixin, ObjectBase);

const HtxAudioView = observer(({ store, item }) => {
  if (!item._value) return null;

  return (
    <ObjectTag item={item}>
      <Fragment>
        <Waveform
          src={item._value}
          selectRegion={item.selectRegion}
          handlePlay={item.handlePlay}
          onCreate={item.wsCreated}
          addRegion={item.addRegion}
          onLoad={item.onLoad}
          speed={item.speed}
          zoom={item.zoom}
          volume={item.volume}
          regions={item.regs}
          height={item.height}
        />

        <AudioControls item={item} store={store} />
        <div style={{ marginBottom: "4px" }}></div>
      </Fragment>
    </ObjectTag>
  );
});

const HtxAudioPlus = inject("store")(observer(HtxAudioView));

Registry.addTag("audioplus", AudioPlusModel, HtxAudioPlus);

export { AudioRegionModel, AudioPlusModel, HtxAudioPlus };
