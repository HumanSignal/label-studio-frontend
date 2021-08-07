import React from "react";

import RegionsMixin from "../../../mixins/Regions";
import { types, getRoot, getType, flow } from "mobx-state-tree";
import { restoreNewsnapshot } from "../../../core/Helpers";
import ObjectBase from "../Base";
import { RichTextRegionModel } from "../../../regions/RichTextRegion";
import Infomodal from "../../../components/Infomodal/Infomodal";
import Utils from "../../../utils";
import { customTypes } from "../../../core/CustomTypes";
import { parseValue } from "../../../utils/data";
import { AnnotationMixin } from "../../../mixins/AnnotationMixin";
import { observe, reaction } from "mobx";
import * as xpath from "xpath-range";
import { findRangeNative, rangeToGlobalOffset } from "../../../utils/selection-tools";

const SUPPORTED_STATES = ["LabelsModel", "HyperTextLabelsModel", "RatingModel"];

const WARNING_MESSAGES = {
  dataTypeMistmatch: () => "Do not put text directly in task data if you use valueType=url.",
  badURL: url => `URL (${url}) is not valid.`,
  secureMode: () => 'In SECURE MODE valueType is set to "url" by default.',
  loadingError: (url, error) => `Loading URL (${url}) unsuccessful: ${error}`,
};

/**
 * RichText tag shows text or HTML and allows labeling
 * @example
 * <RichText name="text-1" value="$text" granularity="symbol" highlightColor="#ff0000" />
 * @example
 * <Text name="text-1" value="$url" valueType="url" highlightColor="#ff0000" />
 * @example
 * <HyperText name="text-1" value="$html" highlightColor="#ff0000" />
 * @name Text
 * @param {string} name                                   - name of the element
 * @param {string} value                                  - value of the element
 * @param {url|text} [valueType=url|text]                – source of the data
 * @param {boolean} [saveTextResult=true]                 – whether or not to save selected text to the serialized data
 * @param {boolean} [selectionEnabled=true]               - enable or disable selection
 * @param {boolean} [clickableLinks=false]                 – allow annotator to open resources from links
 * @param {string} [highlightColor]                       - hex string with highlight color, if not provided uses the labels color
 * @param {boolean} [showLabels=true]                     - whether or not to show labels next to the region
 * @param {none|base64|base64unicode} [encoding]          - decode value from an encoded string
 * @param {symbol|word|sentence|paragraph} [granularity]   - control region selection granularity
 */
const TagAttrs = types.model("RichTextModel", {
  name: types.identifier,
  value: types.maybeNull(types.string),

  /** Defines the type of data to be shown */
  valuetype: types.optional(types.enumeration(["text", "url"]), () => (window.LS_SECURE_MODE ? "url" : "text")),

  /** Whether or not to save selected text to the serialized data */
  savetextresult: types.optional(types.enumeration(["none", "no", "yes"]), () =>
    window.LS_SECURE_MODE ? "no" : "none",
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
    _value: types.optional(types.string, ""),
  })
  .views(self => ({
    get hasStates () {
      const states = self.states();

      return states && states.length > 0;
    },

    get regs () {
      return self.annotation.regionStore.regions.filter(r => r.object === self);
    },

    states () {
      return self.annotation.toNames.get(self.name);
    },

    activeStates () {
      const states = self.states();

      return states ? states.filter(s => s.isSelected && SUPPORTED_STATES.includes(getType(s).name)) : null;
    },
  }))
  .volatile(() => ({
    rootNodeRef: React.createRef(),
    originalContentRef: React.createRef(),
    regsObserverDisposer: null,
  }))
  .actions(self => ({
    setRef (rootNodeRef, originalContentRef) {
      self.rootNodeRef = rootNodeRef;
      self.originalContentRef = originalContentRef;
    },

    updateValue: flow(function * (store) {
      const value = parseValue(self.value, store.task.dataObj);

      if (self.valuetype === "url") {
        const url = value;

        if (!/^https?:\/\//.test(url)) {
          const message = [WARNING_MESSAGES.dataTypeMistmatch(), WARNING_MESSAGES.badURL(url)];

          if (window.LS_SECURE_MODE) message.unshift(WARNING_MESSAGES.secureMode());

          Infomodal.error(message.map((t, i) => <p key={i}>{t}</p>));
          self.setRemoteValue("");
          return;
        }

        try {
          const response = yield fetch(url);
          const { ok, status, statusText } = response;

          if (!ok) throw new Error(`${status} ${statusText}`);

          self.setRemoteValue(yield response.text());
        } catch (error) {
          Infomodal.error(WARNING_MESSAGES.loadingError(url, error));
          self.setRemoteValue("");
        }
      } else {
        self.setRemoteValue(value);
      }
    }),

    setRemoteValue (val) {
      self.loaded = true;

      if (self.encoding === "base64") val = atob(val);
      if (self.encoding === "base64unicode") val = Utils.Checkers.atobUnicode(val);

      self._value = val;

      self._regionsCache.forEach(({ region, annotation }) => {
        region.setText(self._value.substring(region.startOffset, region.endOffset));
        self.regions.push(region);
        annotation.addRegion(region);
      });

      self._regionsCache = [];
    },

    afterCreate () {
      self._regionsCache = [];

      // security measure, if valuetype is set to url then LS
      // doesn't save the text into the result, otherwise it does
      // can be aslo directly configured
      if (self.savetextresult === "none") {
        if (self.valuetype === "url") self.savetextresult = "no";
        else if (self.valuetype === "text") self.savetextresult = "yes";
      }

      // Watch all the changes to the regions list to properly update the text
      // their XPaths relatively to each other
      self.regsObserverDisposer = observe(self, 'regs', () => {
        self.regs.forEach(reg => self.fixRegionsXPath(reg));
      });
    },

    fixRegionsXPath (region) {
      // Text regions don't use XPath
      if (region.isText) return;

      const range = region._cachedRange;

      if (range && region.globalOffsets) {
        const root = self.originalContentRef.current;

        const rangeFromGlobal = findRangeNative(
          region.globalOffsets.start,
          region.globalOffsets.end,
          root,
        );

        const normedRange = xpath.fromRange(rangeFromGlobal, root);

        region.updateXPath(normedRange);
      }
    },

    beforeDestroy () {
      self.regsObserverDisposer?.();
    },

    needsUpdate () {
      self.regs.forEach(region => region.applyHighlight());
    },

    createRegion (regionData) {
      const region = RichTextRegionModel.create({
        ...regionData,
        isText: self.type === "text",
      });


      if (self.valuetype === "url" && self.loaded === false) {
        self._regionsCache.push({ region, annotation: self.annotation });
        return;
      }

      self.regions.push(region);
      self.annotation.addRegion(region);

      region.applyHighlight();

      return region;
    },

    addRegion (range) {
      const states = self.getAvailableStates();

      if (states.length === 0) return;

      const control = states[0];
      const labels = { [control.valueType]: control.selectedValues() };
      const area = self.annotation.createResult(range, labels, control, self);

      area._range = range._range;

      const [soff, eoff] = rangeToGlobalOffset(range._range, self.rootNodeRef.current);

      if (range.isText) {
        area.updateOffsets(soff, eoff);
      }

      area.updateGlobalOffsets(soff, eoff);

      area.applyHighlight();

      return area;
    },
  }));

export const RichTextModel = types.compose("RichTextModel", RegionsMixin, TagAttrs, Model, AnnotationMixin, ObjectBase);
