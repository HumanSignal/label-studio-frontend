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
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";
import { PreviewGenerator } from "../../mixins/PreviewGenerator";

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
  name: types.identifier,
  value: types.maybeNull(types.string),
  zoom: types.optional(types.boolean, true),
  volume: types.optional(types.boolean, true),
  speed: types.optional(types.boolean, true),
  hotkey: types.maybeNull(types.string),
  showlabels: types.optional(types.boolean, false),
  showscores: types.optional(types.boolean, false),
  height: types.optional(types.string, "128"),
});

const Model = types
  .model("AudioPlusModel", {
    type: "audio",
    _value: types.optional(types.string, ""),

    playing: types.optional(types.boolean, false),
    regions: types.array(AudioRegionModel),
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();
      return states && states.length > 0;
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get regs() {
      return self.completion?.regionStore.regions.filter(r => r.object === self) || [];
    },

    states() {
      return self.completion.toNames.get(self.name);
    },

    activeStates() {
      const states = self.states();
      return states && states.filter(s => getType(s).name === "LabelsModel" && s.isSelected);
    },
  }))
  .actions(self => ({
    onHotKey(e) {
      e && e.preventDefault();
      return self._ws.playPause();
    },

    fromStateJSON(obj, fromModel) {
      let r;
      let m;

      const fm = self.completion.names.get(obj.from_name);
      fm.fromStateJSON(obj);

      if (!fm.perregion && fromModel.type !== "labels") return;

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

      r = self.findRegion({ start: obj.value.start, end: obj.value.end });

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
        parentID: wsRegion.parent_id === null ? "" : wsRegion.parent_id,
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
      // area id is assigned to WS region during deserealization
      const find_r = self.completion.areas.get(ws_region.id);

      if (find_r) {
        find_r.applyCSSClass(ws_region);

        find_r._ws_region = ws_region;
        return find_r;
      }

      const states = self.getAvailableStates();
      if (states.length === 0) {
        ws_region.remove && ws_region.remove();
        return;
      }

      const control = self.activeStates()[0];
      const labels = { [control.valueType]: control.selectedValues() };
      const r = self.completion.createResult(ws_region, labels, control, self);
      r._ws_region = ws_region;
      r.updateAppearenceFromState();
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

      self.regs.forEach(obj => {
        const reg = {
          id: obj.id,
          start: obj.start,
          end: obj.end,
          color: "orange",
        };

        if (obj.readonly) {
          reg.drag = false;
          reg.resize = false;
        }

        const r = self._ws.addRegion(reg);
        obj._ws_region = r;
        obj.updateAppearenceFromState();
      });
    },

    wsCreated(ws) {
      self._ws = ws;
    },
  }));

const AudioPlusModel = types.compose(
  "AudioPlusModel",
  TagAttrs,
  Model,
  ProcessAttrsMixin,
  ObjectBase,
  PreviewGenerator,
);

const HtxAudioView = ({ store, item }) => {
  if (!item._value) return null;

  return (
    <ObjectTag item={item}>
      <Fragment>
        <Waveform
          dataField={item.value}
          src={item._value}
          selectRegion={item.selectRegion}
          handlePlay={item.handlePlay}
          onCreate={item.wsCreated}
          addRegion={item.addRegion}
          onLoad={item.onLoad}
          speed={item.speed}
          zoom={item.zoom}
          volume={item.volume}
          regions={true}
          height={item.height}
        />

        <AudioControls item={item} store={store} />
        <div style={{ marginBottom: "4px" }}></div>
      </Fragment>
    </ObjectTag>
  );
};

const HtxAudioPlus = inject("store")(observer(HtxAudioView));

Registry.addTag("audioplus", AudioPlusModel, HtxAudioPlus);
Registry.addObjectType(AudioPlusModel);

export { AudioRegionModel, AudioPlusModel, HtxAudioPlus };
