import * as xpath from "xpath-range";
import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { types, getType, getRoot } from "mobx-state-tree";

import ObjectBase from "./Base";
import ObjectTag from "../../components/Tags/Object";
import RegionsMixin from "../../mixins/Regions";
import Registry from "../../core/Registry";
import Utils from "../../utils";
import { TextRegionModel } from "../../regions/TextRegion";
import { cloneNode } from "../../core/Helpers";
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";
import { highlightRange, splitBoundaries } from "../../utils/html";
import { runTemplate } from "../../core/Template";
import styles from "./Text/Text.module.scss";

/**
 * Text tag shows an Text markup that can be labeled
 * @example
 * <Text name="text-1" value="$text"></Text>
 * @name Text
 * @param {string} name of the element
 * @param {string} value of the element
 * @param {string} [encoding=string|base64] provide the html as an escaped string or base64 encoded string
 */
const TagAttrs = types.model("TextModel", {
  name: types.maybeNull(types.string),
  value: types.maybeNull(types.string),

  hidden: types.optional(types.enumeration(["true", "false"]), "false"),
  selectionenabled: types.optional(types.boolean, true),

  matchlabel: types.optional(types.boolean, false),

  granularity: types.optional(types.enumeration(["symbol", "word", "sentence", "paragraph"]), "symbol"),
  encoding: types.optional(types.string, "string"),
});

const Model = types
  .model("TextModel", {
    id: types.optional(types.identifier, guidGenerator),
    type: "text",
    regions: types.array(TextRegionModel),
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
      return states
        ? states.filter(s => s.isSelected && (getType(s).name === "LabelsModel" || getType(s).name === "RatingModel"))
        : null;
    },
  }))
  .actions(self => ({
    setRef(ref) {
      self._ref = ref;
    },

    needsUpdate() {
      self._update = self._update + 1;
    },

    findRegion(start, startOffset, end, endOffset) {
      const immutableRange = self.regions.find(r => {
        return r.start === start && r.end === end && r.startOffset === startOffset && r.endOffset === endOffset;
      });
      return immutableRange;
    },

    updateValue(store) {
      self._value = runTemplate(self.value, store.task.dataObj);
    },

    createRegion(p) {
      const r = TextRegionModel.create({
        startOffset: p.startOffset,
        endOffset: p.endOffset,
        start: p.start,
        end: p.end,
        text: p.text,
        states: p.states,
      });

      // console.log(p.start, p.end);

      r._range = p._range;

      self.regions.push(r);
      self.completion.addRegion(r);

      return r;
    },

    addRegion(range) {
      const states = self.activeStates();
      if (states.length === 0) return;

      const clonedStates = states
        ? states.map(s => {
            return cloneNode(s);
          })
        : null;

      const r = self.createRegion({ ...range, states: clonedStates });

      states &&
        states.forEach(s => {
          return s.unselectAll();
        });

      return r;
    },

    /**
     * Return JSON
     */
    toStateJSON() {
      const objectsToReturn = self.regions.map(r => r.toStateJSON());
      return objectsToReturn;
    },

    /**
     *
     * @param {*} obj
     * @param {*} fromModel
     */
    fromStateJSON(obj, fromModel) {
      const { start, startOffset, end, endOffset, text } = obj.value;

      if (fromModel.type === "textarea" || fromModel.type === "choices") {
        self.completion.names.get(obj.from_name).fromStateJSON(obj);
        return;
      }

      const states = restoreNewsnapshot(fromModel);

      // console.log(start, end);

      const tree = {
        pid: obj.id,
        startOffset: start,
        endOffset: end,
        start: "",
        end: "",
        text: text,
        normalization: obj.normalization,
        states: [states],
      };

      states.fromStateJSON(obj);

      const r = self.createRegion(tree);

      self.needsUpdate();
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

    return val;
  }

  alignRange(r) {
    const item = this.props.item;

    if (item.granularity == "symbol") return r;

    const offset = r.startOffset;

    const mainOffsets = element => {
      var range = window
        .getSelection()
        .getRangeAt(0)
        .cloneRange();
      let start = range.startOffset;
      let end = range.endOffset;

      let passedStart = false;
      let passedEnd = false;

      const traverse = node => {
        if (!node) return;

        if (node.nodeName == "#text") {
          if (node != range.startContainer && !passedStart) start = start + node.length;
          if (node == range.startContainer) passedStart = true;

          if (node != range.endContainer && !passedEnd) end = end + node.length;
          if (node == range.endContainer) passedEnd = true;
        }

        if (node.nodeName == "BR") {
          if (!passedStart) start = start + 1;

          if (!passedEnd) end = end + 1;
        }

        if (node.childNodes.length > 0) {
          for (var i = 0; i <= node.childNodes.length; i++) {
            const n = node.childNodes[i];
            const res = traverse(n);

            if (res) return res;
          }
        }
      };

      const node = traverse(element);

      return { start: start, end: end };
    };

    const { start, end } = mainOffsets(this.myRef);

    // given gobal position and selection node find node
    // with correct position
    const findIdxContainer = globidx => {
      const el = this.myRef;
      let len = globidx;

      const traverse = node => {
        if (!node) return;

        if (node.nodeName == "#text") {
          if (len - node.length <= 0) return node;
          else len = len - node.length;
        } else if (node.nodeName == "BR") {
          len = len - 1;
        } else if (node.childNodes.length > 0) {
          for (var i = 0; i <= node.childNodes.length; i++) {
            const n = node.childNodes[i];
            const res = traverse(n);

            if (res) return res;
          }
        }
      };

      const node = traverse(el);

      return { node, len };
    };

    if (item.granularity == "word") {
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
          const { node, len } = findIdxContainer(idx + 1);
          r2.setStart(node, len);
        }
      }

      const strright = val.substring(end, val.length);

      if (strright.length > 0) {
        let idxSpace = strright.indexOf(" ");
        let idxNewline = strright.indexOf("\n");

        let idx;

        if (idxNewline == -1) idx = idxSpace;
        if (idxSpace == -1) idx = idxNewline;

        if (idxNewline > 0 && idxSpace > 0) {
          idx = idxSpace > idxNewline ? idxNewline : idxSpace;
        }

        idx = idx + end;

        if (idx === -1) {
          r2.setEnd(r.endContainer, r.endContainer.length);
        }

        if (idx > 0) {
          const { node, len } = findIdxContainer(idx + 1);
          r2.setEnd(node, len - 1);
        }
      }

      return r2;
    }

    if (item.granularity == "sentence") {
    }

    if (item.granularity == "paragraph") {
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

      try {
        var normedRange = xpath.fromRange(r, self.myRef);
        splitBoundaries(r);

        normedRange._range = r;
        normedRange.text = selection.toString();

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

  onMouseUp(ev) {
    var selectedRanges = this.captureDocumentSelection();

    const states = this.props.item.activeStates();

    if (!states || states.length === 0) return;

    if (selectedRanges.length === 0) {
      return;
    }

    const htxRange = this.props.item.addRegion(selectedRanges[0]);

    let labelColor = htxRange.states.map(s => {
      return s.getSelectedColor();
    });

    if (labelColor.length !== 0) {
      labelColor = Utils.Colors.convertToRGBA(labelColor[0], 0.3);
    }

    const spans = highlightRange(
      htxRange,
      "htx-highlight",
      { backgroundColor: labelColor },
      htxRange.states.map(s => s.getSelectedNames()),
    );

    htxRange._spans = spans;

    const names = Utils.Checkers.flatten(htxRange.states.map(s => s.getSelectedNames()));

    let cssCls = "htx-label-" + names.join("-");
    cssCls = cssCls.toLowerCase();
    htxRange._className = cssCls;

    Utils.HTML.createClass("." + cssCls + ":after", 'content:"' + "[" + names.join(",") + ']"');

    const lastSpan = spans[spans.length - 1];
    if (!lastSpan) return;

    lastSpan.className = "htx-highlight htx-highlight-last " + cssCls;
    htxRange._lastSpan = lastSpan;
  }

  _handleUpdate() {
    const root = this.myRef;
    const { item } = this.props;

    item.regions.forEach(function(r) {
      const findNode = (el, pos) => {
        let left = pos;
        const traverse = node => {
          if (node.nodeName == "#text") {
            if (left - node.length <= 0) return { node, left };

            left = left - node.length;
          }

          if (node.nodeName == "BR") {
            if (left - 1 <= 0) return { node, left };

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

      const ss = findNode(root, r.startOffset);
      const ee = findNode(root, r.endOffset);

      const range = document.createRange();
      range.setStart(ss.node, ss.left);
      range.setEnd(ee.node, ee.left);

      splitBoundaries(range);

      r._range = range;

      let labelColor = r.states.map(s => {
        return s.getSelectedColor();
      });

      if (labelColor.length !== 0) {
        labelColor = Utils.Colors.convertToRGBA(labelColor[0], 0.3);
      }

      const spans = highlightRange(
        r,
        "htx-highlight",
        { backgroundColor: labelColor },
        r.states.map(s => s.getSelectedNames()),
      );

      // console.log(spans);

      const names = Utils.Checkers.flatten(r.states.map(s => s.getSelectedNames()));

      let cssCls = "htx-label-" + names.join("-");
      cssCls = cssCls.toLowerCase();

      const lastSpan = spans[spans.length - 1];
      lastSpan.className = "htx-highlight htx-highlight-last " + cssCls;

      Utils.HTML.createClass("." + cssCls + ":after", 'content:"' + "[" + names.join(",") + ']"');

      r._className = cssCls;
      r._lastSpan = lastSpan;
      r._spans = spans;
    });

    Array.from(this.myRef.getElementsByTagName("a")).forEach(a => {
      a.addEventListener("click", function(ev) {
        ev.preventDefault();
        return false;
      });
    });
  }

  componentDidUpdate() {
    this._handleUpdate();
  }

  componentDidMount() {
    this._handleUpdate();
  }

  render() {
    const { item, store } = this.props;

    let val = runTemplate(item.value, store.task.dataObj);
    if (item.encoding === "base64") val = atob(val);

    val = val.split("\n").join("<br/>");

    // console.log("hello world");

    return (
      <ObjectTag item={item}>
        <div
          ref={ref => {
            this.myRef = ref;
            item.setRef(ref);
          }}
          className={styles.block + " htx-text"}
          data-update={item._update}
          style={{ overflow: "auto" }}
          onMouseUp={this.onMouseUp.bind(this)}
          dangerouslySetInnerHTML={{ __html: val }}
        />
      </ObjectTag>
    );
  }
}

const HtxText = inject("store")(observer(HtxTextView));
const HtxTextPieceView = inject("store")(observer(TextPieceView));

Registry.addTag("text", TextModel, HtxText);

export { TextModel, HtxText };
