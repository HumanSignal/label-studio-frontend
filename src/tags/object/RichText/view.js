import React, { Component } from "react";
import { splitBoundaries } from "../../../utils/html";
import ObjectTag from "../../../components/Tags/Object";
import * as xpath from "xpath-range";
import { observer, inject } from "mobx-react";
import { runTemplate } from "../../../core/Template";
import utils from "../../../utils";

class HtxRichTextView extends Component {
  render() {
    const { item, store } = this.props;

    if (!item._value) return null;

    return <HtxRichTextPieceView store={store} item={item} />;
  }
}

class RichTextPieceView extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  captureDocumentSelection() {
    const self = this;
    const ranges = [];
    const selection = window.getSelection();
    const selectionText = selection.toString();

    if (selection.isCollapsed) return [];

    for (let i = 0; i < selection.rangeCount; i++) {
      var range = selection.getRangeAt(i);
      console.log("Initial", range.startContainer, range.endContainer);

      let normedRange = xpath.fromRange(range, self.myRef.current);

      if (normedRange) {
        splitBoundaries(range);
        console.log("Second update", range.startContainer, range.endContainer);

        normedRange._range = range;
        normedRange.text = selectionText;

        ranges.push(normedRange);
      }
    }

    // BrowserRange#normalize() modifies the DOM structure and deselects the
    // underlying text as a result. So here we remove the selected ranges and
    // reapply the new ones.
    selection.removeAllRanges();

    return ranges;
  }

  onMouseUp = () => {
    const item = this.props.item;
    const states = item.activeStates();
    if (!states || states.length === 0) return;

    const selectedRanges = this.captureDocumentSelection();

    if (selectedRanges.length === 0) return;

    item._currentSpan = null;

    const htxRange = item.addRegion(selectedRanges[0]);
    if (htxRange) {
      const spans = htxRange.createSpans();
      htxRange.addEventsToSpans(spans);
    }
  };

  _handleUpdate() {
    console.log("Updated");
    const root = this.myRef.current;
    const { item } = this.props;

    item.regions.forEach(function(region) {
      try {
        const range = xpath.toRange(region.start, region.startOffset, region.end, region.endOffset, root);

        splitBoundaries(range);

        region._range = range;
        const spans = region.createSpans();
        region.addEventsToSpans(spans);

        console.log({ region, range, spans });
      } catch (err) {
        console.log({ region, err });
      }
    });

    if (!item.clickablelinks) {
      root.addEventListener("click", e => {
        if (e.target.tagName === "A" || e.target.closest("a") !== null) {
          e.preventDefault();
        }
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

    let val = runTemplate(item.value, store.task.dataObj);
    if (item.encoding === "base64") val = atob(val);
    if (item.encoding === "base64unicode") val = utils.Checkers.atobUnicode(val);

    val = val.replace(/\n/g, "<br>");
    return (
      <ObjectTag item={item}>
        <div
          ref={this.myRef}
          data-update={item._update}
          style={{ overflow: "auto" }}
          onMouseUp={this.onMouseUp}
          className="htx-richtext"
          dangerouslySetInnerHTML={{ __html: val }}
        />
      </ObjectTag>
    );
  }
}

const HtxRichTextPieceView = inject("store")(observer(RichTextPieceView));

export const HtxRichText = inject("store")(observer(HtxRichTextView));
