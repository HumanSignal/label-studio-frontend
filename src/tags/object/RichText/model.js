import React from "react";

import RegionsMixin from "../../../mixins/Regions";
import { types, getRoot, getType } from "mobx-state-tree";
import { restoreNewsnapshot, guidGenerator, cloneNode } from "../../../core/Helpers";
import ObjectBase from "../Base";
import { runTemplate } from "../../../core/Template";
import { RichTextRegionModel } from "../../../regions/RichTextRegion";
import Infomodal from "../../../components/Infomodal/Infomodal";
import Utils from "../../../utils";
import { customTypes } from "../../../core/CustomTypes";
import * as xpath from "xpath-range";

const SUPPORTED_STATES = ["LabelsModel", "HyperTextLabelsModel", "RatingModel"];

const WARNING_MESSAGES = {
  dataTypeMistmatch: () => "You should not put text directly in your task data if you use valueType=url.",
  badURL: url => `URL (${url}) is not valid.`,
  secureMode: () => 'In SECURE MODE valueType set to "url" by default.',
  loadingError: (url, error) => `Loading URL (${url}) unsuccessful: ${error}`,
};

/**
 * RichText tag shows text or html and allows labeling
 * @example
 * <RichText name="text-1" value="$text" granularity="symbol" highlightColor="#ff0000" />
 * @example
 * <Text name="text-1" value="$url" valueType="url" highlightColor="#ff0000" />
 * @example
 * <HyperText name="text-1" value="$hmtl" highlightColor="#ff0000" />
 * @name Text
 * @param {string} name                                   - name of the element
 * @param {string} value                                  - value of the element
 * @param {url|text} [valueType=url|text]                – source of the data
 * @param {boolean} [saveTextResult=true]                 – wether or not to save selected text to the serialized data
 * @param {boolean} [selectionEnabled=true]               - enable or disable selection
 * @param {boolan} [clickableLinks=false]                 – allow to open resources from links
 * @param {string} [highlightColor]                       - hex string with highlight color, if not provided uses the labels color
 * @param {boolean} [showLabels=true]                     - show labels next to the region
 * @param {none|base64|base64unicode} [encoding]          - decode value from encoded string
 * @param {symbol|word|sentence|paragrap} [granularity]   - control selection granularity
 */
const TagAttrs = types.model("RichTextModel", {
  name: types.identifier,
  value: types.maybeNull(types.string),

  /** Defines the type of data to be shown */
  valuetype: types.optional(types.enumeration(["text", "url"]), () => (window.LS_SECURE_MODE ? "url" : "text")),

  /** Wether or not to save selected text to the serialized data */
  savetextresult: types.optional(types.enumeration(["none", "no", "yes"]), () =>
    window.LS_SECURE_MODE ? "no" : "yes",
  ),

  selectionenabled: types.optional(types.boolean, true),

  clickablelinks: false,

  highlightcolor: types.maybeNull(customTypes.color),

  showlabels: types.optional(types.boolean, true),

  encoding: types.optional(types.enumeration(["none", "base64", "base64unicode"]), "none"),

  granularity: types.optional(types.enumeration(["symbol", "word", "sentence", "paragraph"]), "symbol"),
});

const Model = types
  .model("RichTextModel", {
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

    get regs() {
      return self.completion.regionStore.regions.filter(r => r.object === self);
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
    setRoot(root) {
      self._rootNode = root;
    },

    async updateValue(store) {
      self._value = runTemplate(self.value, store.task.dataObj);

      if (self.valuetype === "url") {
        const url = self._value;

        if (!/^https?:\/\//.test(url)) {
          const message = [WARNING_MESSAGES.dataTypeMistmatch(), WARNING_MESSAGES.badURL(url)];
          if (window.LS_SECURE_MODE) message.unshift(WARNING_MESSAGES.secureMode());

          Infomodal.error(message.map(t => <p>{t}</p>));
          self.setRemoteValue("");
          return;
        }

        const response = await fetch(url);
        const { ok, status, statusText } = response;

        try {
          if (!ok) throw new Error(`${status} ${statusText}`);

          self.setRemoteValue(await response.text());
        } catch (error) {
          Infomodal.error(WARNING_MESSAGES.loadingError(url, error));
          self.setRemoteValue("");
        }
      } else {
        self.setRemoteValue(self._value);
      }
    },

    setRemoteValue(val) {
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
        if (self.valuetype === "url") self.savetextresult = "no";
        else if (self.valuetype === "text") self.savetextresult = "yes";
      }
    },

    createRegion(regionData) {
      const region = RichTextRegionModel.create({
        ...regionData,
        isText: self.type === "text",
      });

      region._getRange = () => {
        if (region._cachedRegion === undefined) {
          return (region._cachedRegion = regionData._range ?? self._createNativeRange(regionData, region.isText));
        }

        return region._cachedRegion;
      };

      region._getRootNode = () => {
        return self._rootNode;
      };

      if (self.valuetype === "url" && self.loaded === false) {
        self._regionsCache.push({ region, completion: self.completion });
        return;
      }

      self.regions.push(region);
      self.completion.addRegion(region);

      region.applyHighlight();

      return region;
    },

    addRegion(range) {
      const states = self.getAvailableStates();
      if (states.length === 0) return;

      const control = states[0];
      const labels = { [control.valueType]: control.selectedValues() };
      const area = self.completion.createResult(range, labels, control, self);
      area._range = range._range;
      return area;
    },

    fromStateJSON(obj, fromModel) {
      if (fromModel.type === "textarea" || fromModel.type === "choices") {
        self.completion.names.get(obj.from_name).fromStateJSON(obj);
        return;
      }

      const tree = self._objectFromJSON(obj, fromModel);

      console.log({ tree });
      self.createRegion(tree);
    },

    _objectFromJSON(obj, fromModel, { createRange } = {}) {
      const { start, startOffset, end, endOffset, text } = obj.value;

      const states = restoreNewsnapshot(fromModel);
      const tree = {
        pid: obj.id,
        parentID: obj.parent_id === null ? "" : obj.parent_id,
        startOffset: startOffset,
        endOffset: endOffset,
        start: start ?? "",
        end: end ?? "",
        text: text,
        score: obj.score,
        readonly: obj.readonly,
        normalization: obj.normalization,
        states: [states],
      };

      if (!startOffset && !endOffset) {
        tree.startOffset = start;
        tree.endOffset = end;
        tree.start = "";
        tree.end = "";
        tree.isText = true;
      }

      states.fromStateJSON(obj);

      return tree;
    },

    _createNativeRange(htxRange, isText) {
      const rootNode = self._rootNode;

      if (rootNode === undefined) return undefined;

      const { start, startOffset, end, endOffset } = htxRange;

      try {
        if (isText) {
          const { startContainer, endContainer } = Utils.Selection.findRange(startOffset, endOffset, rootNode);
          const range = document.createRange();
          range.setStart(startContainer.node, startContainer.position);
          range.setEnd(endContainer.node, endContainer.position);
          return range;
        }

        return xpath.toRange(start, startOffset, end, endOffset, rootNode);
      } catch (err) {
        if (rootNode) console.log(err);
      }

      return undefined;
    },
  }));

export const RichTextModel = types.compose("RichTextModel", RegionsMixin, TagAttrs, Model, ObjectBase);
