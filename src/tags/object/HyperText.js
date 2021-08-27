import * as xpath from "xpath-range";
import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { getType, types } from "mobx-state-tree";

import Utils from "../../utils";
import ObjectBase from "./Base";
import ObjectTag from "../../components/Tags/Object";
import RegionsMixin from "../../mixins/Regions";
import Registry from "../../core/Registry";
import { HyperTextRegionModel } from "../../regions/HyperTextRegion";
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";
import { splitBoundaries } from "../../utils/html";
import { parseValue } from "../../utils/data";
import { customTypes } from "../../core/CustomTypes";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";

/**
 * HyperText tag shows HyperText markup that can be labeled.
 * @example
 * <View>
 *   <HyperText name="text-1" value="$text" />
 *   <Labels name="parts" toName="text-1">
 *     <Label value="Caption" />
 *     <Label value="Article" />
 *     <Label value="Author" />
 *   </Labels>
 * </View>
 * @name HyperText
 * @regions HyperTextRegion
 * @meta_title Hypertext Tags for Hypertext Markup (HTML)
 * @meta_description Label Studio Hypertext Tags customize Label Studio for hypertext markup (HTML) for machine learning and data science projects.
 * @param {string} name - Name of the element
 * @param {string} value - Value of the element
 * @param {url|text} [valueType]       - Where the text is stored — directly in uploaded data or needs to be loaded from a URL
 * @param {yes|no} [saveTextResult]    - Whether or not to store labeled text along with the results. By default doesn't store text for `valueType=url`
 * @param {boolean} [showLabels=false] - Whether to show labels next to the region
 * @param {none|base64|base64unicode} [encoding]  - How to decode values from encoded strings
 * @param {boolean} [clickableLinks=false] - Whether to allow opening resources from links in the hypertext markup.
 */
const TagAttrs = types.model("HyperTextModel", {
  // opional for cases with inline html: <HyperText><hr/></HyperText>
  name: types.optional(types.identifier, guidGenerator(5)),
  value: types.maybeNull(types.string),

  // @todo add `valueType=url` to HyperText and make autodetection of `savetextresult`
  savetextresult: types.optional(types.enumeration(["none", "no", "yes"]), () =>
    window.LS_SECURE_MODE ? "no" : "yes",
  ),

  clickablelinks: false,

  highlightcolor: types.maybeNull(customTypes.color),
  showlabels: types.optional(types.boolean, false),

  encoding: types.optional(types.enumeration(["none", "base64", "base64unicode"]), "none"),
});

const Model = types
  .model("HyperTextModel", {
    type: "hypertext",
    _value: types.optional(types.string, ""),
    _update: types.optional(types.number, 1),
  })
  .views(self => ({
    get hasStates() {
      const states = self.states();

      return states && states.length > 0;
    },

    get regs() {
      return self.annotation.regionStore.regions.filter(r => r.object === self);
    },

    states() {
      return self.annotation.toNames.get(self.name);
    },

    activeStates() {
      const states = self.states();

      return states
        ? states.filter(
          s => s.isSelected && (getType(s).name === "HyperTextLabelsModel" || getType(s).name === "RatingModel"),
        )
        : null;
    },
  }))
  .actions(self => ({
    needsUpdate() {
      self._update = self._update + 1;
    },

    updateValue(store) {
      self._value = parseValue(self.value, store.task.dataObj);
    },

    createRegion(p) {
      const r = HyperTextRegionModel.create({
        pid: p.id,
        ...p,
      });

      r._range = p._range;

      self.regions.push(r);
      self.annotation.addRegion(r);

      return r;
    },

    addRegion(range) {
      const states = self.getAvailableStates();

      if (states.length === 0) return;

      const control = states[0];
      const labels = { [control.valueType]: control.selectedValues() };
      const area = self.annotation.createResult(range, labels, control, self);

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
        normalization: obj.normalization,
        states: [states],
      };

      states.fromStateJSON(obj);

      self.createRegion(tree);

      self.needsUpdate();
    },
  }));

const HyperTextModel = types.compose("HyperTextModel", RegionsMixin, TagAttrs, Model, ObjectBase, AnnotationMixin);

class HtxHyperTextView extends Component {
  render() {
    const { item, store } = this.props;

    if (!item._value) return null;

    return <HtxHyperTextPieceView store={store} item={item} />;
  }
}

class HyperTextPieceView extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
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

      try {
        var normedRange = xpath.fromRange(r, self.myRef.current);

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
      } catch (err) {
        console.warn(err);
      }
    }

    // BrowserRange#normalize() modifies the DOM structure and deselects the
    // underlying text as a result. So here we remove the selected ranges and
    // reapply the new ones.
    selection.removeAllRanges();

    return ranges;
  }

  onMouseUp() {
    const item = this.props.item;
    const states = item.activeStates();

    if (!states || states.length === 0) return;

    var selectedRanges = this.captureDocumentSelection();

    if (selectedRanges.length === 0) return;

    item._currentSpan = null;

    const htxRange = item.addRegion(selectedRanges[0]);

    if (htxRange) {
      const spans = htxRange.createSpans();

      htxRange.addEventsToSpans(spans);
    }
  }

  _handleUpdate() {
    const root = this.myRef.current;
    const { item } = this.props;

    item.regs.forEach(function(r) {
      // spans can be totally missed if this is app init or undo/redo
      // or they can be disconnected from DOM on annotations switching
      // so we have to recreate them from regions data
      if (r._spans?.[0]?.isConnected) return;

      try {
        const range = xpath.toRange(r.start, r.startOffset, r.end, r.endOffset, root);

        if (!r.text && range.toString()) {
          r.setText(range.toString());
        }

        splitBoundaries(range);

        r._range = range;
        const spans = r.createSpans();

        r.addEventsToSpans(spans);
      } catch (err) {
        console.log(r);
      }
    });

    if (!item.clickablelinks) {
      Array.from(this.myRef.current.getElementsByTagName("a")).forEach(a => {
        a.addEventListener("click", function(ev) {
          ev.preventDefault();
          return false;
        });
      });
    }
  }

  componentDidUpdate() {
    this._handleUpdate();
  }

  componentDidMount() {
    this._handleUpdate();
  }

  render() {
    const { item, store } = this.props;

    let val = parseValue(item.value, store.task.dataObj);

    if (item.encoding === "base64") val = atob(val);
    if (item.encoding === "base64unicode") val = Utils.Checkers.atobUnicode(val);

    return (
      <ObjectTag item={item}>
        <div
          ref={this.myRef}
          data-update={item._update}
          style={{ overflow: "auto" }}
          onMouseUp={this.onMouseUp.bind(this)}
          dangerouslySetInnerHTML={{ __html: val }}
        />
      </ObjectTag>
    );
  }
}

const HtxHyperText = inject("store")(observer(HtxHyperTextView));
const HtxHyperTextPieceView = inject("store")(observer(HyperTextPieceView));

Registry.addTag("hypertext", HyperTextModel, HtxHyperText);

export { HyperTextModel, HtxHyperText };
