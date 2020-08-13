import * as xpath from "xpath-range";
import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { types, getRoot } from "mobx-state-tree";

import ObjectBase from "./Base";
import ObjectTag from "../../components/Tags/Object";
import RegionsMixin from "../../mixins/Regions";
import Registry from "../../core/Registry";
import Utils from "../../utils";
import { TextRegionModel } from "../../regions/TextRegion";
import { cloneNode } from "../../core/Helpers";
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";
import { splitBoundaries } from "../../utils/html";
import { runTemplate } from "../../core/Template";
import styles from "./Text/Text.module.scss";
import InfoModal from "../../components/Infomodal/Infomodal";

/**
 * Text tag shows an Text markup that can be labeled
 * @example
 * <Text name="text-1" value="$text" granularity="symbol" highlightColor="#ff0000" />
 * @name Text
 * @param {string} name                      - name of the element
 * @param {string} value                     - value of the element
 * @param {boolean} [selectionEnabled=true]  - enable or disable selection
 * @param {string} [highlightColor]          - hex string with highlight color, if not provided uses the labels color
 * @param {symbol|word} [granularity=symbol] - control per symbol or word selection
 * @param {boolean} [showLabels=true]        - show labels next to the region
 * @param {string} [encoding=none|base64|base64unicode]  - decode value from encoded string
 */
const TagAttrs = types.model("TextModel", {
  name: types.identifier,
  value: types.maybeNull(types.string),

  valuetype: types.optional(types.enumeration(["text", "url"]), "text"),

  savetextresult: types.optional(types.enumeration(["none", "no", "yes"]), "none"),

  selectionenabled: types.optional(types.boolean, true),

  highlightcolor: types.maybeNull(types.string),
  // matchlabel: types.optional(types.boolean, false),

  // [TODO]
  showlabels: types.optional(types.boolean, true),

  granularity: types.optional(types.enumeration(["symbol", "word", "sentence", "paragraph"]), "symbol"),

  encoding: types.optional(types.enumeration(["none", "base64", "base64unicode"]), "none"),
});

const Model = types
  .model("TextModel", {
    // id: types.optional(types.identifier, guidGenerator),
    type: "text",
    loaded: types.optional(types.boolean, false),
    // regions: types.array(TextRegionModel),
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
      return states && states.filter(s => s.isSelected && s._type === "labels");
    },
  }))
  .actions(self => ({
    setRef(ref) {
      self._ref = ref;
    },

    needsUpdate() {
      self._update = self._update + 1;
    },

    updateValue(store) {
      self._value = runTemplate(self.value, store.task.dataObj);

      if (self.valuetype === "url") {
        const url = self._value;
        if (!/^https?:\/\//.test(url)) {
          InfoModal.error(`URL (${url}) is not valid`);
          self.loadedValue("");
          return;
        }
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return res.text();
          })
          .then(self.loadedValue)
          .catch(e => {
            InfoModal.error(`Loading URL (${url}) unsuccessful: ${e}`);
            self.loadedValue("");
          });
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
        if (self.valuetype === "url") self.savetextresult = "no";
        else if (self.valuetype === "text") self.savetextresult = "yes";
      }
    },

    createRegion(p) {
      const r = TextRegionModel.create(p);

      r._range = p._range;

      if (self.valuetype === "url" && self.loaded === false) {
        self._regionsCache.push({ region: r, completion: self.completion });
        return;
      }

      self.regions.push(r);
      self.completion.addRegion(r);

      return r;
    },

    addRegion(range) {
      range.start = range.startOffset;
      range.end = range.endOffset;
      const area = self.completion.createResult(range, self.activeStates()[0], self);
      area._range = range._range;
      self.completion.unselectAll();
      return area;
      // const states = self.getAvailableStates();
      // if (states.length === 0) return;

      // const clonedStates = states.map(s => cloneNode(s));

      // const r = self.createRegion({ ...range, states: clonedStates });

      // return r;
    },

    /**
     *
     * @param {*} obj
     * @param {*} fromModel
     */
    fromStateJSON(obj, fromModel) {
      let r;
      let m;

      const fm = self.completion.names.get(obj.from_name);
      fm.fromStateJSON(obj);

      if (!fm.perregion && fromModel.type !== "labels") return;

      const { start, end } = obj.value;

      r = self.findRegion({ startOffset: obj.value.start, endOffset: obj.value.end });

      if (fromModel) {
        m = restoreNewsnapshot(fromModel);
        // m.fromStateJSON(obj);

        if (r && fromModel.perregion) {
          r.states.push(m);
        } else {
          // tree.states = [m];
          const data = {
            pid: obj.id,
            parentID: obj.parent_id === null ? "" : obj.parent_id,
            startOffset: start,
            endOffset: end,
            start: "",
            end: "",
            score: obj.score,
            readonly: obj.readonly,
            text: self._value.substring(start, end),
            normalization: obj.normalization,
            states: [m],
          };

          r = self.createRegion(data);
          // r = self.addRegion(tree);
        }
      }

      // states.fromStateJSON(obj);

      // r.updateAppearenceFromState();

      return r;

      // self.createRegion(tree);
      // self.needsUpdate();
    },
  }));

const TextModel = types.compose("TextModel", RegionsMixin, TagAttrs, Model, ObjectBase);

class HtxTextView extends Component {
  render() {
    const { item, store } = this.props;

    if (!item._value) return null;

    return <HtxTextPieceView store={store} item={item} />;
  }
}

class TextPieceView extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  getValue() {
    const { item, store } = this.props;

    let val = runTemplate(item.value, store.task.dataObj);
    if (item.encoding === "base64") val = atob(val);
    if (item.encoding === "base64unicode") val = Utils.Checkers.atobUnicode(val);

    return val;
  }

  alignWord(r, start, end) {
    const val = this.getValue();
    const strleft = val.substring(0, start);
    const r2 = r.cloneRange();

    if (strleft.length > 0) {
      let idxSpace = strleft.lastIndexOf(" ");
      let idxNewline = strleft.lastIndexOf("\n");

      let idx = idxSpace > idxNewline ? idxSpace : idxNewline;

      if (idx === -1) {
        r2.setStart(r.startContainer, 0);
      }

      if (idx > 0) {
        const { node, len } = Utils.HTML.findIdxContainer(this.myRef, idx + 1);
        r2.setStart(node, len);
      }
    }

    const strright = val.substring(end, val.length);

    if (strright.length > 0) {
      let idxSpace = strright.indexOf(" ");
      let idxNewline = strright.indexOf("\n");

      let idx;

      if (idxNewline === -1) idx = idxSpace;
      if (idxSpace === -1) idx = idxNewline;

      if (idxNewline > 0 && idxSpace > 0) {
        idx = idxSpace > idxNewline ? idxNewline : idxSpace;
      }

      idx = idx + end;

      if (idx === -1) {
        r2.setEnd(r.endContainer, r.endContainer.length);
      }

      if (idx > 0) {
        const { node, len } = Utils.HTML.findIdxContainer(this.myRef, idx + 1);
        r2.setEnd(node, len > 0 ? len - 1 : 0);
      }
    }

    return r2;
  }

  alignRange(r) {
    const item = this.props.item;

    if (item.granularity === "symbol") return r;

    const { start, end } = Utils.HTML.mainOffsets(this.myRef);

    // given gobal position and selection node find node
    // with correct position
    if (item.granularity === "word") {
      return this.alignWord(r, start, end);
    }

    if (item.granularity === "sentence") {
    }

    if (item.granularity === "paragraph") {
    }
  }

  captureDocumentSelection() {
    var i,
      self = this,
      ranges = [],
      rangesToIgnore = [],
      selection = window.getSelection();

    if (selection.isCollapsed) return [];

    for (i = 0; i < selection.rangeCount; i++) {
      var r = selection.getRangeAt(i);

      if (r.endContainer.nodeName === "DIV") {
        r.setEnd(r.startContainer, r.startContainer.length);
      }

      r = this.alignRange(r);

      if (r.collapsed || /^\s*$/.test(r.toString())) continue;

      try {
        var normedRange = xpath.fromRange(r, self.myRef);

        splitBoundaries(r);

        normedRange._range = r;

        // Range toString() uses only text nodes content
        // so to extract original new lines made into <br>s we should get all the tags
        const tags = Array.from(r.cloneContents().childNodes);
        // and convert every <br> back to new line
        const text = tags.reduce((str, node) => (str += node.tagName === "BR" ? "\n" : node.textContent), "");
        normedRange.text = text;

        const ss = Utils.HTML.toGlobalOffset(self.myRef, r.startContainer, r.startOffset);
        const ee = Utils.HTML.toGlobalOffset(self.myRef, r.endContainer, r.endOffset);

        normedRange.startOffset = ss;
        normedRange.endOffset = ee;

        // If the new range falls fully outside our this.element, we should
        // add it back to the document but not return it from this method.
        if (normedRange === null) {
          rangesToIgnore.push(r);
        } else {
          ranges.push(normedRange);
        }
      } catch (err) {}
    }

    // BrowserRange#normalize() modifies the DOM structure and deselects the
    // underlying text as a result. So here we remove the selected ranges and
    // reapply the new ones.
    selection.removeAllRanges();

    return ranges;
  }

  onClick(ev) {
    // console.log('click');
  }

  onMouseUp(ev) {
    const item = this.props.item;
    if (!item.selectionenabled) return;

    const states = item.activeStates();
    if (!states || states.length === 0) return;

    var selectedRanges = this.captureDocumentSelection();
    if (selectedRanges.length === 0) return;

    // prevent overlapping spans from being selected right after this
    item._currentSpan = null;

    const htxRange = item.addRegion(selectedRanges[0]);
    if (htxRange) {
      const spans = htxRange.createSpans();
      htxRange.addEventsToSpans(spans);
    }
  }

  _handleUpdate() {
    const root = this.myRef;
    const { item } = this.props;

    item.regs.forEach(function(r) {
      const findNode = (el, pos) => {
        let left = pos;
        const traverse = node => {
          if (node.nodeName === "#text") {
            if (left - node.length <= 0) return { node, left };

            left = left - node.length;
          }

          if (node.nodeName === "BR") {
            if (left - 1 < 0) return { node, left };

            left = left - 1;
          }

          for (var i = 0; i <= node.childNodes.length; i++) {
            const n = node.childNodes[i];
            if (n) {
              const res = traverse(n);
              if (res) return res;
            }
          }
        };

        return traverse(el);
      };

      const ss = findNode(root, r.start);
      const ee = findNode(root, r.end);

      // if (! ss || ! ee)
      //     return;

      const range = document.createRange();
      range.setStart(ss.node, ss.left);
      range.setEnd(ee.node, ee.left);

      splitBoundaries(range);

      r._range = range;

      const spans = r.createSpans();
      r.addEventsToSpans(spans);
    });
  }

  componentDidUpdate() {
    this._handleUpdate();
  }

  componentDidMount() {
    this._handleUpdate();
  }

  render() {
    const { item } = this.props;

    if (!item.loaded) return null;

    const val = item._value.split("\n").reduce((res, s, i) => {
      if (i) res.push(<br key={i} />);
      res.push(s);
      return res;
    }, []);

    return (
      <ObjectTag item={item}>
        <div
          ref={ref => {
            this.myRef = ref;
            item.setRef(ref);
          }}
          className={styles.block + " htx-text"}
          data-update={item._update}
          onMouseUp={this.onMouseUp.bind(this)}
        >
          {val}
        </div>
      </ObjectTag>
    );
  }
}

const HtxText = inject("store")(observer(HtxTextView));
const HtxTextPieceView = inject("store")(observer(TextPieceView));

Registry.addTag("text", TextModel, HtxText);
Registry.addObjectType(TextModel);

export { TextModel, HtxText };
