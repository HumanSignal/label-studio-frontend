import React from "react";
import { observer, inject } from "mobx-react";
import { types, getRoot } from "mobx-state-tree";

import AudioControls from "./Audio/Controls";
import ObjectBase from "./Base";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import ObjectTag from "../../components/Tags/Object";
import Registry from "../../core/Registry";
import Waveform from "../../components/Waveform/Waveform";
import { ErrorMessage } from "../../components/ErrorMessage/ErrorMessage";

/**
 * Audio tag plays a simple audio file. 
 * @example
 * <View>
 *   <Audio name="audio" value="$audio" />
 * </View>
 * @example
 * <!-- Audio classification -->
 * <View>
 *   <Audio name="audio" value="$audio" />
 *   <Choices name="ch" toName="audio">
 *     <Choice value="Positive" />
 *     <Choice value="Negative" />
 *   </Choices>
 * </View>
 * @example
 * <!-- Audio transcription -->
 * <View>
 *   <Audio name="audio" value="$audio" />
 *   <TextArea name="ta" toName="audio" />
 * </View>
 * @name Audio
 * @param {string} name Name of the element
 * @param {string} value Value of the element
 * @param {string} hotkey Hotkey used to play or pause audio
 */

const TagAttrs = types.model({
  name: types.identifier,
  value: types.maybeNull(types.string),
  zoom: types.optional(types.boolean, false),
  volume: types.optional(types.boolean, false),
  speed: types.optional(types.boolean, false),
  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model({
    type: "audio",
    _value: types.optional(types.string, ""),
    playing: types.optional(types.boolean, false),
    height: types.optional(types.string, "20"),
  })
  .views(self => ({
    get annotation() {
      return getRoot(self).annotationStore.selected;
    },
  }))
  .volatile(self => ({
    errors: [],
  }))
  .actions(self => ({
    fromStateJSON(obj, fromModel) {
      if (obj.value.choices) {
        self.annotation.names.get(obj.from_name).fromStateJSON(obj);
      }

      if (obj.value.text) {
        self.annotation.names.get(obj.from_name).fromStateJSON(obj);
      }
    },

    handlePlay() {
      self.playing = !self.playing;
    },

    onHotKey() {
      self._ws.playPause();
      return false;
    },

    onLoad(ws) {
      self._ws = ws;
    },

    onError(error) {
      self.errors = [error];
    },

    wsCreated(ws) {
      self._ws = ws;
    },
  }));

const AudioModel = types.compose("AudioModel", Model, TagAttrs, ProcessAttrsMixin, ObjectBase);

const HtxAudioView = ({ store, item }) => {
  if (!item._value) return null;

  return (
    <ObjectTag item={item}>
      {item.errors?.map(error => (
        <ErrorMessage error={error} />
      ))}
      <Waveform
        dataField={item.value}
        src={item._value}
        onCreate={item.wsCreated}
        onLoad={item.onLoad}
        onError={item.onError}
        handlePlay={item.handlePlay}
        speed={item.speed}
        zoom={item.zoom}
        volume={item.volume}
        regions={false}
        height={item.height}
      />
      <AudioControls item={item} store={store} />
    </ObjectTag>
  );
};

const HtxAudio = inject("store")(observer(HtxAudioView));

Registry.addTag("audio", AudioModel, HtxAudio);
Registry.addObjectType(AudioModel);

export { AudioModel, HtxAudio };
