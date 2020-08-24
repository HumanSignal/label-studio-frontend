import React, { Component } from "react";
import { matchesSelector } from "../../../utils/html";
import ObjectTag from "../../../components/Tags/Object";
import * as xpath from "xpath-range";
import { observer, inject } from "mobx-react";
import { runTemplate } from "../../../core/Template";
import utils from "../../../utils";
import * as selectionTools from "../../../utils/selection-tools";

class RichTextPieceView extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  _onMouseUp = () => {
    const { item } = this.props;
    const states = item.activeStates();
    const root = this.myRef.current;
    if (!states || states.length === 0) return;
    if (item.selectionenabled === false) return;

    selectionTools.captureSelection(
      ({ selectionText, range }) => {
        if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
          return;
        }

        const normedRange = xpath.fromRange(range, root);

        if (!normedRange) return;

        normedRange._range = range;
        normedRange.text = selectionText;

        const richTextRegion = item.addRegion(normedRange);

        if (!richTextRegion) return;

        richTextRegion.applyHighlight();
      },
      { granularity: item.granularity },
    );
  };

  /**
   * @param {MouseEvent} event
   */
  _onRegionClick = event => {
    if (!this.props.item.clickablelinks && matchesSelector(event.target, "a")) {
      event.preventDefault();
      return;
    }

    const region = this._detectRegion(event.target);

    if (!region) return;

    region && region.onClickRegion();
    event.stopPropagation();
  };

  /**
   * @param {MouseEvent} event
   */
  _onRegionMouseOver = event => {
    const region = this._detectRegion(event.target);
    this.props.item.regions.forEach(r => r.setHighlight(false));

    if (!region) return;

    if (region.completion.relationMode) {
      region.setHighlight(true);
    }
  };

  /**
   * Handle initial rendering and all subsequent updates
   */
  _handleUpdate() {
    this.props.item.regions.forEach(richTextRegion => {
      try {
        richTextRegion.applyHighlight();
      } catch (err) {
        console.log({ region: richTextRegion, err });
      }
    });
  }

  /**
   * Detects a RichTextRegion corresponding to a span
   * @param {HTMLElement} element
   */
  _detectRegion(element) {
    if (matchesSelector(element, ".htx-highlight")) {
      const span = element.tagName === "SPAN" ? element : element.closest(".htx-highlight");
      return this.props.item.regions.find(region => region.find(span));
    }
  }

  componentDidMount() {
    this.props.item.setRoot(this.myRef.current);
    this._handleUpdate();
  }

  componentDidUpdate() {
    this._handleUpdate();
  }

  render() {
    const { item, store } = this.props;

    if (!item._value) return null;

    let val = runTemplate(item.value, store.task.dataObj);
    if (item.encoding === "base64") val = atob(val);
    if (item.encoding === "base64unicode") val = utils.Checkers.atobUnicode(val);

    const eventHandlers = {
      onClick: this._onRegionClick,
      onMouseUp: this._onMouseUp,
      onMouseOverCapture: this._onRegionMouseOver,
    };

    val = val.replace(/\n/g, "<br>");
    return (
      <ObjectTag item={item}>
        <div
          ref={this.myRef}
          style={{ overflow: "auto" }}
          data-update={item._update}
          className="htx-richtext"
          dangerouslySetInnerHTML={{ __html: val }}
          {...eventHandlers}
        />
      </ObjectTag>
    );
  }
}

export const HtxRichText = inject("store")(observer(RichTextPieceView));
