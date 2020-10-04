import React, { Component } from "react";
import { htmlEscape, matchesSelector } from "../../../utils/html";
import ObjectTag from "../../../components/Tags/Object";
import * as xpath from "xpath-range";
import { observer, inject } from "mobx-react";
import Utils from "../../../utils";

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

    console.log(states[0].selectedLabels);
    const label = states[0]?.selectedLabels?.[0];

    Utils.Selection.captureSelection(
      ({ selectionText, range }) => {
        if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
          return;
        }

        const normedRange = xpath.fromRange(range, root);

        if (!normedRange) return;

        const isText = item.type === "text";
        let globalStartOffset, globalEndOffset;

        normedRange._range = range;
        normedRange.text = selectionText;
        normedRange.isText = isText;

        if (isText) {
          const { startContainer, startOffset, endContainer, endOffset } = range;
          globalStartOffset = Utils.HTML.toGlobalOffset(root, startContainer, startOffset);
          globalEndOffset = Utils.HTML.toGlobalOffset(root, endContainer, endOffset);
        }

        const region = item.addRegion(normedRange);

        if (globalStartOffset && globalEndOffset) {
          region.updateOffsets(globalStartOffset, globalEndOffset);
        }
      },
      {
        granularity: label?.granularity ?? item.granularity,
        beforeCleanup: () => (this._selectionMode = true),
      },
    );
  };

  /**
   * @param {MouseEvent} event
   */
  _onRegionClick = event => {
    if (this._selectionMode) {
      this._selectionMode = false;
      return;
    }

    if (!this.props.item.clickablelinks && matchesSelector(event.target, "a")) {
      event.preventDefault();
      return;
    }

    const region = this._determineRegion(event.target);

    if (!region) return;

    region && region.onClickRegion();
    event.stopPropagation();
  };

  /**
   * @param {MouseEvent} event
   */
  _onRegionMouseOver = event => {
    const region = this._determineRegion(event.target);
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
        console.log(err, { region: richTextRegion });
      }
    });
  }

  /**
   * Detects a RichTextRegion corresponding to a span
   * @param {HTMLElement} element
   */
  _determineRegion(element) {
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
    const { item, isText } = this.props;

    if (!item._value) return null;
    const eventHandlers = {
      onClickCapture: this._onRegionClick,
      onMouseUp: this._onMouseUp,
      onMouseOverCapture: this._onRegionMouseOver,
    };

    const val = (isText ? htmlEscape(item._value) : item._value).replace(/\n|\r/g, "<br>");
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

export const HtxRichText = ({ isText } = { isText: false }) => {
  return inject("store")(observer(props => <RichTextPieceView {...props} isText={isText} />));
};
