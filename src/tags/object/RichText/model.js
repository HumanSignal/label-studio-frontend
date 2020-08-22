import React from "react";

import RegionsMixin from "../../../mixins/Regions";
import { types, getRoot, getType } from "mobx-state-tree";
import { restoreNewsnapshot, guidGenerator, cloneNode } from "../../../core/Helpers";
import { customTypes } from "../../../core/CustomTypes";
import ObjectBase from "../Base";
import { runTemplate } from "../../../core/Template";
import { RichTextRegionModel } from "../../../regions";
import Infomodal from "../../../components/Infomodal/Infomodal";
import Utils from "../../../utils";

const SUPPORTED_STATES = ["HyperTextLabelsModel", "RatingModel"];

const WARNING_MESSAGES = {
  dataTypeMistmatch: () => "You should not put text directly in your task data if you use datasource=url.",
  badURL: url => `URL (${url}) is not valid.`,
  secureMode: () => 'In SECURE MODE datasource set to "url" by default.',
  loadingError: (url, error) => `Loading URL (${url}) unsuccessful: ${error}`,
};

const TagAttrs = types.model("RichTextModel", {
  name: types.maybeNull(types.string),
  value: types.maybeNull(types.string),

  valuetype: types.optional(types.enumeration(["text", "html"]), "html"),

  datasource: types.optional(types.enumeration(["text", "url"]), () => (window.LS_SECURE_MODE ? "url" : "text")),

  // @todo add `datasource=url` to HyperText and make autodetection of `savetextresult`
  savetextresult: types.optional(types.enumeration(["none", "no", "yes"]), () =>
    window.LS_SECURE_MODE ? "no" : "yes",
  ),

  selectionenabled: types.optional(types.boolean, true),

  clickablelinks: false,

  highlightcolor: types.maybeNull(customTypes.color),

  showlabels: types.optional(types.boolean, false),

  encoding: types.optional(types.enumeration(["none", "base64", "base64unicode"]), "none"),

  granularity: types.optional(types.enumeration(["symbol", "word", "sentence", "paragraph"]), "symbol"),
});

const Model = types
  .model("RichTextModel", {
    id: types.optional(types.identifier, guidGenerator),
    type: "richtext",
    regions: types.array(RichTextRegionModel),
    _value: types.optional(types.string, ""),
    _update: types.optional(types.number, 1),
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
      return states ? states.filter(s => s.isSelected && SUPPORTED_STATES.includes(getType(s).name)) : null;
    },
  }))
  .actions(self => ({
    needsUpdate() {
      self._update = self._update + 1;
    },

    async updateValue(store) {
      self._value = runTemplate(self.value, store.task.dataObj);

      if (self.datasource === "url") {
        const url = self._value;

        if (!/^https?:\/\//.test(url)) {
          const message = [WARNING_MESSAGES.dataTypeMistmatch(), WARNING_MESSAGES.badURL(url)];
          if (window.LS_SECURE_MODE) message.unshift(WARNING_MESSAGES.secureMode());

          Infomodal.error(message.map(t => <p>{t}</p>));
          self.loadedValue("");
          return;
        }

        const { ok, status, statusText, ...response } = await fetch(url);

        if (!ok) throw new Error(`${status} ${statusText}`);

        try {
          self.loadedValue(await response.text());
        } catch (error) {
          Infomodal.error(WARNING_MESSAGES.loadingError(url, error));
          self.loadedValue("");
        }
      } else {
        self.loadedValue(self._value);
      }
    },

    loadedValue(val) {
      self.loaded = true;
      if (self.encoding === "base64") val = atob(val);
      if (self.encoding === "base64unicode") val = Utils.Checkers.atobUnicode(val);

      self._value = val;

      self._regionsCache.forEach(({ region, completion }) => {
        region.setText(self._value.substring(region.startOffset, region.endOffset));
        self.regions.push(region);
        completion.addRegion(region);
      });

      self._regionsCache = [];
    },

    afterCreate() {
      self._regionsCache = [];

      // security measure, if valuetype is set to url then LS
      // doesn't save the text into the result, otherwise it does
      // can be aslo directly configured
      if (self.savetextresult === "none") {
        if (self.datasource === "url") self.savetextresult = "no";
        else if (self.datasource === "text") self.savetextresult = "yes";
      }
    },

    createRegion(p) {
      const r = RichTextRegionModel.create({
        pid: p.id,
        ...p,
      });

      r._range = p._range;

      self.regions.push(r);
      self.completion.addRegion(r);

      return r;
    },

    addRegion(range) {
      const states = self.getAvailableStates();
      if (states.length === 0) return;

      const clonedStates = states.map(s => cloneNode(s));

      const r = self.createRegion({ ...range, states: clonedStates });

      return r;
    },

    fromStateJSON(obj, fromModel) {
      const { start, startOffset, end, endOffset, text } = obj.value;

      if (fromModel.type === "textarea" || fromModel.type === "choices") {
        self.completion.names.get(obj.from_name).fromStateJSON(obj);
        return;
      }

      const states = restoreNewsnapshot(fromModel);
      const tree = {
        pid: obj.id,
        parentID: obj.parent_id === null ? "" : obj.parent_id,
        startOffset: startOffset,
        endOffset: endOffset,
        start: start,
        end: end,
        text: text,
        score: obj.score,
        readonly: obj.readonly,
        normalization: obj.normalization,
        states: [states],
      };

      states.fromStateJSON(obj);

      self.createRegion(tree);

      self.needsUpdate();
    },
  }));

export const RichTextModel = types.compose("RichTextModel", RegionsMixin, TagAttrs, ObjectBase, Model);
