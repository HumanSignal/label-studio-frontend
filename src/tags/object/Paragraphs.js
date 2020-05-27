import * as xpath from "xpath-range";
import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { types, getType, getRoot } from "mobx-state-tree";
import ColorScheme from "pleasejs";

import ObjectBase from "./Base";
import ObjectTag from "../../components/Tags/Object";
import RegionsMixin from "../../mixins/Regions";
import Registry from "../../core/Registry";
import Utils from "../../utils";
import { HyperTextModel, HtxHyperTextView } from "./HyperText";
import { ParagraphsRegionModel } from "../../regions/ParagraphsRegion";
import { cloneNode } from "../../core/Helpers";
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";
import { splitBoundaries } from "../../utils/html";
import { runTemplate } from "../../core/Template";
import styles from "./Paragraphs/Paragraphs.module.scss";
import InfoModal from "../../components/Infomodal/Infomodal";

/**
 * Paragraphs tag shows an Paragraphs markup that can be labeled
 * @example
 * <Paragraphs name="dialogue-1" value="$dialogue" granularity="symbol" highlightColor="#ff0000" />
 * @name Paragraphs
 * @param {string} name                      - name of the element
 * @param {string} value                     - value of the element
 * @param {boolean} [selectionEnabled=true]  - enable or disable selection
 * @param {string} [highlightColor]          - hex string with highlight color, if not provided uses the labels color
 * @param {symbol|word} [granularity=symbol] - control per symbol or word selection
 * @param {boolean} [showLabels=true]        - show labels next to the region
 * @param {string} [encoding=string|base64]  - decode value from a plain or base64 encoded string
 */
const TagAttrs = types.model("ParagraphsModel", {
  name: types.maybeNull(types.string),
  value: types.maybeNull(types.string),

  highlightcolor: types.maybeNull(types.string),
  showlabels: types.optional(types.boolean, false),

  encoding: types.optional(types.enumeration(["string", "base64"]), "string"),

  layout: types.optional(types.enumeration(["none", "dialogue"]), "none"),

  savetextresult: types.optional(types.enumeration(["none", "no", "yes"]), "none"),

  namekey: types.optional(types.string, "author"),
  textkey: types.optional(types.string, "text"),
});

const Model = types
  .model("ParagraphsModel", {
    id: types.optional(types.identifier, guidGenerator),
    type: "paragraphs",
    regions: types.array(ParagraphsRegionModel),
    //_value: types.optional(types.string, ""),
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

    get _value() {
      const store = getRoot(self);
      const val = self.value.substr(1);
      return store.task.dataObj[val];
    },

    layoutStyles(data) {
      if (self.layout === "dialogue") {
        const seed = data[self.namekey];
        return {
          phrase: { backgroundColor: Utils.Colors.convertToRGBA(ColorScheme.make_color({ seed: seed })[0], 0.1) },
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
      };
    },

    states() {
      return self.completion.toNames.get(self.name);
    },

    activeStates() {
      const states = self.states();
      return states && states.filter(s => s.isSelected && s._type === "htmllabels");
    },
  }))
  .actions(self => ({
    needsUpdate() {
      self._update = self._update + 1;
    },

    createRegion(p) {
      const r = ParagraphsRegionModel.create({
        pid: p.id,
        ...p,
      });

      r._range = p._range;

      self.regions.push(r);
      self.completion.addRegion(r);

      return r;
    },

    addRegion(range) {
      const states = self.activeStates();
      if (states.length === 0) return;

      const clonedStates = states.map(s => cloneNode(s));

      const r = self.createRegion({ ...range, states: clonedStates });

      return r;
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

      const startXpath = "/div[" + (+start + 1) + "]/span[2]/text()[1]";
      const endXpath = "/div[" + (+end + 1) + "]/span[2]/text()[1]";

      const tree = {
        pid: obj.id,
        startOffset: startOffset,
        endOffset: endOffset,

        start: startXpath,
        end: endXpath,

        // [TODO|Andrew] need a way to get the text
        text: "",
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

const ParagraphsModel = types.compose("ParagraphsModel", RegionsMixin, TagAttrs, Model, ObjectBase);

class HtxParagraphsView extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  getSelectionText(sel) {
    return sel.toString();
  }

  captureDocumentSelection() {
    const cls = this.props.item.layoutClasses;
    const names = [...this.myRef.current.getElementsByClassName(cls.name)];
    names.forEach(el => {
      el.style.visibility = "hidden";
    });

    var i,
      self = this,
      ranges = [],
      rangesToIgnore = [],
      selection = window.getSelection();

    if (selection.isCollapsed) {
      names.forEach(el => {
        el.style.visibility = "unset";
      });
      return [];
    }

    for (i = 0; i < selection.rangeCount; i++) {
      var r = selection.getRangeAt(i);

      if (r.endContainer.nodeName === "DIV") {
        r.setEnd(r.startContainer, r.startContainer.length);
      }

      try {
        var normedRange = xpath.fromRange(r, self.myRef.current);
        splitBoundaries(r);

        normedRange._range = r;
        normedRange.text = self.getSelectionText(selection);

        // If the new range falls fully outside our this.element, we should
        // add it back to the document but not return it from this method.
        if (normedRange === null) {
          rangesToIgnore.push(r);
        } else {
          ranges.push(normedRange);
        }
      } catch (err) {}
    }

    names.forEach(el => {
      el.style.visibility = "unset";
    });

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

    const spans = htxRange.createSpans();
    htxRange.addEventsToSpans(spans);
  }

  _handleUpdate() {
    const root = this.myRef.current;
    const { item } = this.props;

    item.regions.forEach(function(r) {
      try {
        const range = xpath.toRange(r.start, r.startOffset, r.end, r.endOffset, root);

        splitBoundaries(range);

        r._range = range;
        const spans = r.createSpans();
        r.addEventsToSpans(spans);
      } catch (err) {
        console.log(r);
      }
    });

    Array.from(this.myRef.current.getElementsByTagName("a")).forEach(a => {
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
    const cls = item.layoutClasses;

    const val = item._value.map((v, idx) => {
      const val = v["text"].split("\n").join("<br/>");
      const style = item.layoutStyles(v);

      return (
        <div key={`${item.name}-${idx}`} className={styles.phrase} style={style.phrase}>
          <span className={cls.name}>{v[item.namekey]}</span>
          <span className={cls.text}>{v[item.textkey]}</span>
        </div>
      );
    });

    return (
      <ObjectTag item={item}>
        <div
          ref={this.myRef}
          data-update={item._update}
          style={{ overflow: "auto" }}
          onMouseUp={this.onMouseUp.bind(this)}
          // dangerouslySetInnerHTML={{ __html: val }}
        >
          {val}
        </div>
      </ObjectTag>
    );
  }
}

const HtxParagraphs = inject("store")(observer(HtxParagraphsView));

Registry.addTag("paragraphs", ParagraphsModel, HtxParagraphs);

export { ParagraphsModel, HtxParagraphs };
