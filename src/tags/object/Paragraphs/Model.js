import { createRef } from "react";
import { getRoot, types } from "mobx-state-tree";
import ColorScheme from "pleasejs";

import ObjectBase from "../Base";
import RegionsMixin from "../../../mixins/Regions";
import Utils from "../../../utils";
import { ParagraphsRegionModel } from "../../../regions/ParagraphsRegion";
import { restoreNewsnapshot } from "../../../core/Helpers";
import { parseValue } from "../../../utils/data";
import messages from "../../../utils/messages";
import styles from "./Paragraphs.module.scss";
import { errorBuilder } from "../../../core/DataValidator/ConfigValidator";
import { AnnotationMixin } from "../../../mixins/AnnotationMixin";
import { isValidObjectURL } from "../../../utils/utilities";
import { FF_DEV_2669, isFF } from "../../../utils/feature-flags";

/**
 * The Paragraphs tag displays paragraphs of text on the labeling interface. Use to label dialogue transcripts for NLP and NER projects.
 * The Paragraphs tag expects task data formatted as an array of objects like the following:
 * [{ $nameKey: "Author name", $textKey: "Text" }, ... ]
 *
 * Use with the following data types: text
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
 * @param {string} name                  - Name of the element
 * @param {string} value                 - Data field containing the paragraph content
 * @param {json|url} [valueType=json]    - Whether the data is stored directly in uploaded JSON data or needs to be loaded from a URL
 * @param {string} audioUrl              - Audio to sync phrases with
 * @param {boolean} [showPlayer=false]   - Whether to show audio player above the paragraphs
 * @param {no|yes} [saveTextResult=yes]  - Whether to store labeled text along with the results. By default, doesn't store text for `valueType=url`
 * @param {none|dialogue} [layout=none]  - Whether to use a dialogue-style layout or not
 * @param {string} [nameKey=author]      - The key field to use for name
 * @param {string} [textKey=text]        - The key field to use for the text
 */
const TagAttrs = types.model("ParagraphsModel", {
  name: types.identifier,
  value: types.maybeNull(types.string),
  valuetype: types.optional(types.enumeration(["json", "url"]), () => (window.LS_SECURE_MODE ? "url" : "json")),
  audiourl: types.maybeNull(types.string),
  showplayer: false,

  highlightcolor: types.maybeNull(types.string),
  showlabels: types.optional(types.boolean, false),

  layout: types.optional(types.enumeration(["none", "dialogue"]), "none"),

  // @todo add `valueType=url` to Paragraphs and make autodetection of `savetextresult`
  savetextresult: types.optional(types.enumeration(["none", "no", "yes"]), () =>
    window.LS_SECURE_MODE ? "no" : "yes",
  ),

  namekey: types.optional(types.string, "author"),
  textkey: types.optional(types.string, "text"),
});

const Model = types
  .model("ParagraphsModel", {
    type: "paragraphs",
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

    get audio() {
      if (!self.audiourl) return null;
      if (self.audiourl[0] === "$") {
        const store = getRoot(self);
        const val = self.audiourl.substr(1);

        return store.task.dataObj[val];
      }
      return self.audiourl;
    },

    get regs() {
      return self.annotation.regionStore.regions.filter(r => r.object === self);
    },

    layoutStyles(data) {
      if (self.layout === "dialogue") {
        const seed = data[self.namekey];

        return {
          phrase: { backgroundColor: Utils.Colors.convertToRGBA(ColorScheme.make_color({ seed })[0], 0.25) },
        };
      }

      return {};
    },

    get layoutClasses() {
      if (self.layout === "dialogue") {
        return {
          name: styles.dialoguename,
          text: styles.dialoguetext,
        };
      }

      return {
        name: styles.name,
        text: styles.text,
      };
    },

    states() {
      return self.annotation.toNames.get(self.name);
    },

    activeStates() {
      const states = self.states();

      return states && states.filter(s => s.isSelected && s._type === "paragraphlabels");
    },

    isVisibleForAuthorFilter(data) {
      if(!isFF(FF_DEV_2669)) return true;

      return !self.filterByAuthor.length || self.filterByAuthor.includes(data[self.namekey]);
    },
  }))
  .volatile(() => ({
    _value: "",
    filterByAuthor: [],
    searchAuthor: "",
    playingId: -1,
  }))
  .actions(self => {
    const audioRef = createRef();
    let audioStopHandler = null;
    let endDuration = 0;
    let currentId = -1;

    function stop() {
      const audio = audioRef.current;

      if (audio.paused) return;
      if (audio.currentTime < endDuration) {
        stopIn(endDuration - audio.currentTime);
        return;
      }
      audioStopHandler = null;
      endDuration = 0;
      audio.pause();
      self.reset();
    }

    function stopIn(seconds) {
      audioStopHandler = window.setTimeout(stop, 1000 * seconds);
    }

    return {
      getRef() {
        return audioRef;
      },

      reset() {
        currentId = -1;
        self.playingId = -1;
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
        if (!audio.paused) {
          audio.pause();
          self.playingId = -1;
          if (idx === currentId) return;
        }
        if (idx !== currentId) {
          audio.currentTime = start;
        }
        audio.play();
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
  })
  .actions(self => ({
    needsUpdate() {
      self._update = self._update + 1;
    },

    updateValue(store) {
      const value = parseValue(self.value, store.task.dataObj);

      if (self.valuetype === "url") {
        const url = value;

        if (!isValidObjectURL(url, true)) {
          const message = [];

          if (url) {
            message.push(`URL (${url}) is not valid.`);
            message.push(`You should not put data directly into your task if you use valuetype="url".`);
          } else {
            message.push(`URL is empty, check ${value} in data JSON.`);
          }
          if (window.LS_SECURE_MODE) message.unshift(`In SECURE MODE valuetype set to "url" by default.`);
          store.annotationStore.addErrors([errorBuilder.generalError(message.join("\n"))]);
          self.setRemoteValue("");
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
            self.setRemoteValue("");
          });
      } else {
        self.setRemoteValue(value);
      }
    },

    setRemoteValue(val) {
      const errors = [];

      if (!Array.isArray(val)) {
        errors.push(`Provided data is not an array`);
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
          `It should be an array of objects with fields,`,
          `defined by <b>nameKey</b> ("author" by default)`,
          `and <b>textKey</b> ("text" by default)`,
        ].join(" ");

        self.store.annotationStore.addErrors([
          errorBuilder.generalError(`${general}<ul>${errors.map(error => `<li>${error}</li>`).join("")}</ul>`),
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

    addRegion(range) {
      const states = self.activeStates();

      if (states.length === 0) return;

      const control = states[0];
      const labels = { [control.valueType]: control.selectedValues() };
      const area = self.annotation.createResult(range, labels, control, self);

      if (getRoot(self).autoAnnotation) {
        area.makeDynamic();
      }

      area.notifyDrawingFinished();

      area._range = range._range;
      return area;
    },

    /**
     *
     * @param {*} obj
     * @param {*} fromModel
     */
    fromStateJSON(obj, fromModel) {
      const { start, startOffset, end, endOffset, text } = obj.value;

      if (fromModel.type === "textarea" || fromModel.type === "choices") {
        self.annotation.names.get(obj.from_name).fromStateJSON(obj);
        return;
      }

      const states = restoreNewsnapshot(fromModel);

      const tree = {
        pid: obj.id,
        parentID: obj.parent_id === null ? "" : obj.parent_id,

        startOffset,
        endOffset,

        start,
        end,

        text,
        score: obj.score,
        readonly: obj.readonly,
        flagged: obj.flagged,
        normalization: obj.normalization,
        states: [states],
      };

      states.fromStateJSON(obj);

      self.createRegion(tree);

      self.needsUpdate();
    },
  }));

export const ParagraphsModel = types.compose("ParagraphsModel", RegionsMixin, TagAttrs, Model, ObjectBase, AnnotationMixin);