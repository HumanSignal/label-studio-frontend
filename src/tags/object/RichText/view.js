import React, { Component } from "react";
import { htmlEscape, matchesSelector } from "../../../utils/html";
import ObjectTag from "../../../components/Tags/Object";
import * as xpath from "xpath-range";
import { inject, observer } from "mobx-react";
import Utils from "../../../utils";
import { rangeToGlobalOffset } from "../../../utils/selection-tools";

class RichTextPieceView extends Component {
  constructor (props) {
    super(props);

    this.rootNodeRef = React.createRef();

    this.originalContentRef = React.createRef();

    this.rootRef = props.item.rootNodeRef;
  }

  _onMouseUp = () => {
    const { item } = this.props;
    const states = item.activeStates();
    const root = item.rootNodeRef.current;

    if (!states || states.length === 0) return;
    if (item.selectionenabled === false) return;

    const label = states[0]?.selectedLabels?.[0];

    Utils.Selection.captureSelection(
      ({ selectionText, range }) => {
        if (!range || range.collapsed || !root.contains(range.startContainer) || !root.contains(range.endContainer)) {
          return;
        }

        const normedRange = xpath.fromRange(range, root);

        if (!normedRange) return;

        normedRange._range = range;
        normedRange.text = selectionText;
        normedRange.isText = item.type === "text";

        item.addRegion(normedRange);
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
    const { item } = this.props;

    item.regs.forEach(r => r.setHighlight(false));

    if (!region) return;

    if (region.annotation.relationMode) {
      region.setHighlight(true);
    }
  };

  /**
   * Handle initial rendering and all subsequent updates
   */
  _handleUpdate (initial = false) {
    const { item } = this.props;

    // Make refs accessible to the model
    this.props.item.setRef(
      this.rootNodeRef,
      this.originalContentRef,
    );

    if (initial) {
      item.regs.forEach((richTextRegion) => {
        try {
          const root = this.rootNodeRef.current;
          const { start, startOffset, end, endOffset } = richTextRegion;
          const range = xpath.toRange(start, startOffset, end, endOffset, root);
          const [soff, eoff] = rangeToGlobalOffset(range, root);

          richTextRegion.updateGlobalOffsets(soff, eoff);
        } catch (e) {
          console.warn(e);
        }
      });
    }

    // Apply highlight to ranges of a current tag
    item.regs.forEach(richTextRegion => {
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
  _determineRegion (element) {
    if (matchesSelector(element, ".htx-highlight")) {
      const span = element.tagName === "SPAN" ? element : element.closest(".htx-highlight");
      const { item } = this.props;

      return item.regs.find(region => region.find(span));
    }
  }

  componentDidMount () {
    this._handleUpdate(true);
  }

  componentDidUpdate () {
    this._handleUpdate();
  }

  render () {
    const { item } = this.props;

    if (!item._value) return null;

    const eventHandlers = {
      onClickCapture: this._onRegionClick,
      onMouseUp: this._onMouseUp,
      onMouseOverCapture: this._onRegionMouseOver,
    };

    const content = item._value || "";
    const newLineReplacement = "<br/>";
    const val = (item.type === 'text' ? htmlEscape(content) : content).replace(/\n|\r/g, newLineReplacement);

    return (
      <ObjectTag item={item}>
        <div
          ref={this.rootNodeRef}
          style={{ overflow: "auto" }}
          className="htx-richtext"
          dangerouslySetInnerHTML={{ __html: val }}
          {...eventHandlers}
        />
        <div
          ref={this.originalContentRef}
          className="htx-richtext-orig"
          style={{ display: 'none' }}
          dangerouslySetInnerHTML={{ __html: val }}
        />
      </ObjectTag>
    );
  }
}

const storeInjector = inject("store");

const RPTV = storeInjector(observer(RichTextPieceView));

export const HtxRichText = ({ isText = false } = {}) => {
  return storeInjector(observer(props => {
    return <RPTV {...props} isText={isText} />;
  }));
};
