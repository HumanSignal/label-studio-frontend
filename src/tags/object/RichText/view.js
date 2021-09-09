import React, { Component } from "react";
import { htmlEscape, matchesSelector } from "../../../utils/html";
import ObjectTag from "../../../components/Tags/Object";
import * as xpath from "xpath-range";
import { inject, observer } from "mobx-react";
import Utils from "../../../utils";
import { rangeToGlobalOffset } from "../../../utils/selection-tools";
import "./RichText.styl";

class RichTextPieceView extends Component {
  _regionSpanSelector = ".htx-highlight";

  constructor(props) {
    super(props);

    this.rootNodeRef = React.createRef();

    this.originalContentRef = React.createRef();

    this.rootRef = props.item.rootNodeRef;
  }

  _selectRegions = (additionalMode) => {
    const { item } = this.props;
    const root = item.rootNodeRef.current;
    const selection = window.getSelection();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    const regions = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;

      if (node.nodeName === "SPAN" && node.matches(this._regionSpanSelector) && selection.containsNode(node)) {
        const region = this._determineRegion(node);

        regions.push(region);
      }
    }
    if (regions.length) {
      item.annotation.extendSelectionWith(regions);
      if (additionalMode) {
        item.annotation.extendSelectionWith(regions);
      } else {
        item.annotation.selectAreas(regions);
      }
      selection.removeAllRanges();
    }
  };

  _onMouseUp = (ev) => {
    const { item } = this.props;
    const states = item.activeStates();
    const rootEl = item.rootNodeRef.current;
    const root = rootEl?.contentDocument?.body ?? rootEl;

    if (!states || states.length === 0 || ev.ctrlKey || ev.metaKey) return this._selectRegions(ev.ctrlKey || ev.metaKey);
    if (item.selectionenabled === false) return;

    const label = states[0]?.selectedLabels?.[0];

    Utils.Selection.captureSelection(({ selectionText, range }) => {
      if (!range || range.collapsed || !root.contains(range.startContainer) || !root.contains(range.endContainer)) {
        return;
      }

      const normedRange = xpath.fromRange(range, root);

      if (!normedRange) return;

      normedRange._range = range;
      normedRange.text = selectionText;
      normedRange.isText = item.type === "text";
      normedRange.dynamic = this.props.store.autoAnnotation;

      item.addRegion(normedRange);
    }, {
      window: rootEl?.contentWindow ?? window,
      granularity: label?.granularity ?? item.granularity,
      beforeCleanup: () => (this._selectionMode = true),
    });
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
    region && region.onClickRegion(event);
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
  _handleUpdate(initial = false) {
    const { item } = this.props;
    const rootEl = this.rootNodeRef.current;
    const root = rootEl?.contentDocument?.body ?? rootEl;

    if (!item.inline) {
      if (!root || root.tagName === "IFRAME" || !root.childElementCount) return;
    }

    // Make refs accessible to the model
    this.props.item.setRef(
      this.rootNodeRef,
      this.originalContentRef,
    );

    // @todo both loops should be merged to fix old broken xpath using "dirty" html
    if (initial) {
      item.regs.forEach((richTextRegion) => {
        try {
          const { start, startOffset, end, endOffset } = richTextRegion;
          const range = xpath.toRange(start, startOffset, end, endOffset, root);
          const [soff, eoff] = rangeToGlobalOffset(range, root);

          richTextRegion.updateGlobalOffsets(soff, eoff);
        } catch (e) {
          // should never happen
          // doesn't break anything if happens
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
  _determineRegion(element) {
    if (matchesSelector(element, this._regionSpanSelector)) {
      const span = element.tagName === "SPAN" ? element : element.closest(this._regionSpanSelector);
      const { item } = this.props;

      return item.regs.find(region => region.find(span));
    }
  }

  componentDidMount() {
    this._handleUpdate(true);
  }

  componentDidUpdate() {
    this._handleUpdate();
  }

  _passHotkeys = e => {
    const props = "key code keyCode location ctrlKey shiftKey altKey metaKey".split(" ");
    const init = {};

    for (let prop of props) init[prop] = e[prop];

    const internal = new KeyboardEvent(e.type, init);

    document.dispatchEvent(internal);
  }

  onIFrameLoad = () => {
    const body = this.rootNodeRef.current?.contentDocument?.body;
    const eventHandlers = {
      click: [this._onRegionClick, true],
      keydown: [this._passHotkeys, false],
      keyup: [this._passHotkeys, false],
      keypress: [this._passHotkeys, false],
      mouseup: [this._onMouseUp, false],
      mouseover: [this._onRegionMouseOver, true],
    };

    if (!body) return;

    for (let event in eventHandlers) {
      body.addEventListener(event, ...eventHandlers[event]);
    }

    this._handleUpdate(true);
  }

  render() {
    const { item } = this.props;

    if (!item._value) return null;

    const content = item._value || "";
    const newLineReplacement = "<br/>";
    const val = item.type === 'text'
      ? htmlEscape(content).replace(/\n|\r/g, newLineReplacement)
      : content;

    if (item.inline) {
      const style = {
        overflow: "auto",
        fontSize: 16,
        lineHeight: '26px',
      };
      const eventHandlers = {
        onClickCapture: this._onRegionClick,
        onMouseUp: this._onMouseUp,
        onMouseOverCapture: this._onRegionMouseOver,
      };

      return (
        <ObjectTag item={item}>
          <div
            ref={this.rootNodeRef}
            style={style}
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
    } else {
      const style = {
        border: "none",
        width: "100%",
        minHeight: "60vh",
      };

      return (
        <ObjectTag item={item}>
          <iframe
            referrerPolicy="no-referrer"
            sandbox="allow-same-origin allow-scripts"
            ref={this.rootNodeRef}
            style={style}
            className="htx-richtext"
            srcDoc={val}
            onLoad={this.onIFrameLoad}
          />
          <iframe
            referrerPolicy="no-referrer"
            sandbox="allow-same-origin allow-scripts"
            ref={this.originalContentRef}
            className="htx-richtext-orig"
            style={{ display: 'none' }}
            srcDoc={val}
          />
        </ObjectTag>
      );
    }
  }
}

const storeInjector = inject("store");

const RPTV = storeInjector(observer(RichTextPieceView));

export const HtxRichText = ({ isText = false } = {}) => {
  return storeInjector(observer(props => {
    return <RPTV {...props} isText={isText} />;
  }));
};
