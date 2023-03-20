import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import ObjectTag from '../../../components/Tags/Object';
import { findNodeAt, matchesSelector, splitBoundaries } from '../../../utils/html';
import { isSelectionContainsSpan } from '../../../utils/selection-tools';
import styles from './Paragraphs.module.scss';
import { AuthorFilter } from './AuthorFilter';
import { Phrases } from './Phrases';
import { FF_DEV_2669, FF_DEV_2918, isFF } from '../../../utils/feature-flags';

class HtxParagraphsView extends Component {
  _regionSpanSelector = '.htx-highlight';

  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  getSelectionText(sel) {
    return sel.toString();
  }

  getPhraseElement(node) {
    const cls = this.props.item.layoutClasses;

    while (node && (!node.classList || !node.classList.contains(cls.text))) node = node.parentNode;
    return node;
  }

  get phraseElements() {
    return [...this.myRef.current.getElementsByClassName(this.props.item.layoutClasses.text)];
  }

  /**
   * Check for the selection in the phrase and return the offset and index.
   *
   * @param {HTMLElement} node
   * @param {number} offset
   * @param {boolean} [isStart=true]
   * @return {Array} [offset, node, index, originalIndex]
   */
  getOffsetInPhraseElement(container, offset, isStart = true) {
    const node = this.getPhraseElement(container);
    const range = document.createRange();

    range.setStart(node, 0);
    range.setEnd(container, offset);
    const fullOffset = range.toString().length;
    const phraseIndex = this.phraseElements.indexOf(node);
    let phraseNode = node;

    // if the selection is made from the very end of a given phrase, we need to
    // move the offset to the beginning of the next phrase
    if (isStart && fullOffset === phraseNode.textContent.length) {
      return [0, phraseNode, phraseIndex + 1, phraseIndex];
    }
    // if the selection is made to the very beginning of the next phrase, we need to
    // move the offset to the end of the previous phrase
    else if (!isStart && fullOffset === 0) {
      phraseNode = this.phraseElements[phraseIndex - 1];
      return [phraseNode.textContent.length, phraseNode, phraseIndex - 1, phraseIndex];
    }

    return [fullOffset, phraseNode, phraseIndex, phraseIndex];
  }

  removeSurroundingNewlines(text) {
    return text.replace(/^\n+/, '').replace(/\n+$/, '');
  }

  captureDocumentSelection() {
    const item = this.props.item;
    const cls = item.layoutClasses;
    const names = [...this.myRef.current.getElementsByClassName(cls.name)];

    names.forEach(el => {
      el.style.visibility = 'hidden';
    });

    let i;

    const ranges = [];
    const selection = window.getSelection();

    if (selection.isCollapsed) {
      names.forEach(el => {
        el.style.visibility = 'unset';
      });
      return [];
    }

    for (i = 0; i < selection.rangeCount; i++) {
      const r = selection.getRangeAt(i);

      if (r.endContainer.nodeName === 'DIV') {
        r.setEnd(r.startContainer, r.startContainer.length);
      }
      if (r.collapsed || /^\s*$/.test(r.toString())) continue;

      try {
        splitBoundaries(r);
        const [startOffset, , start, originalStart] = this.getOffsetInPhraseElement(r.startContainer, r.startOffset);
        const [endOffset, , end, originalEnd] = this.getOffsetInPhraseElement(r.endContainer, r.endOffset, false);

        if (isFF(FF_DEV_2918)) {
          const visibleIndexes = item._value.reduce((visibleIndexes, v, idx) => {
            const isContentVisible = item.isVisibleForAuthorFilter(v);

            if (isContentVisible && originalStart <= idx && originalEnd >= idx) {
              visibleIndexes.push(idx);
            }

            return visibleIndexes;
          }, []);

          if (visibleIndexes.length !== originalEnd - originalStart + 1) {
            const texts = this.phraseElements;
            let fromIdx = originalStart;

            for (let k = 0; k < visibleIndexes.length; k++) {
              const curIdx = visibleIndexes[k];
              const isLastVisibleIndex = k === visibleIndexes.length - 1;

              if (isLastVisibleIndex || visibleIndexes[k + 1] !== curIdx + 1) {
                let anchorOffset, focusOffset;

                const _range = r.cloneRange();

                if (fromIdx === originalStart) {
                  fromIdx = start;
                  anchorOffset = startOffset;
                } else {
                  anchorOffset = 0;

                  const walker = texts[fromIdx].ownerDocument.createTreeWalker(texts[fromIdx], NodeFilter.SHOW_ALL);

                  while (walker.firstChild());

                  _range.setStart(walker.currentNode, anchorOffset);
                }
                if (curIdx === end) {
                  focusOffset = endOffset;
                } else {
                  const curRange = document.createRange();

                  curRange.selectNode(texts[curIdx]);
                  focusOffset = curRange.toString().length;

                  const walker = texts[curIdx].ownerDocument.createTreeWalker(texts[curIdx], NodeFilter.SHOW_ALL);

                  while (walker.lastChild());

                  _range.setEnd(walker.currentNode, walker.currentNode.length);
                }

                selection.removeAllRanges();
                selection.addRange(_range);

                const text = this.removeSurroundingNewlines(selection.toString());

                // Sometimes the selection is empty, which is the case for dragging from the end of a line above the
                // target line, while having collapsed lines between.
                if (text) {
                  ranges.push({
                    startOffset: anchorOffset,
                    start: String(fromIdx),
                    endOffset: focusOffset,
                    end: String(curIdx),
                    _range,
                    text,
                  });
                }

                if (visibleIndexes.length - 1 > k) {
                  fromIdx = visibleIndexes[k + 1];
                }
              }
            }
          } else {
            // user selection always has only one range, so we can use selection's text
            // which doesn't contain hidden elements (names in our case)
            ranges.push({
              startOffset,
              start: String(start),
              endOffset,
              end: String(end),
              _range: r,
              text: this.removeSurroundingNewlines(selection.toString()),
            });
          }
        } else {
          // user selection always has only one range, so we can use selection's text
          // which doesn't contain hidden elements (names in our case)
          ranges.push({
            startOffset,
            start: String(start),
            endOffset,
            end: String(end),
            _range: r,
            text: this.removeSurroundingNewlines(selection.toString()),
          });
        }
      } catch (err) {
        console.error('Can not get selection', err);
      }
    }

    names.forEach(el => {
      el.style.visibility = 'unset';
    });

    // BrowserRange#normalize() modifies the DOM structure and deselects the
    // underlying text as a result. So here we remove the selected ranges and
    // reapply the new ones.
    selection.removeAllRanges();

    return ranges;
  }

  _selectRegions = (additionalMode) => {
    const { item } = this.props;
    const root = this.myRef.current;
    const selection = window.getSelection();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    const regions = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;

      if (node.nodeName === 'SPAN' && node.matches(this._regionSpanSelector) && isSelectionContainsSpan(node)) {
        const region = this._determineRegion(node);

        regions.push(region);
      }
    }
    if (regions.length) {
      if (additionalMode) {
        item.annotation.extendSelectionWith(regions);
      } else {
        item.annotation.selectAreas(regions);
      }
      selection.removeAllRanges();
    }
  };

  _determineRegion(element) {
    if (matchesSelector(element, this._regionSpanSelector)) {
      const span = element.tagName === 'SPAN' ? element : element.closest(this._regionSpanSelector);
      const { item } = this.props;

      return item.regs.find(region => region.find(span));
    }
  }

  onMouseUp(ev) {
    const item = this.props.item;
    const states = item.activeStates();

    if (!states || states.length === 0 || ev.ctrlKey || ev.metaKey) return this._selectRegions(ev.ctrlKey || ev.metaKey);

    const selectedRanges = this.captureDocumentSelection();

    if (selectedRanges.length === 0) {
      return;
    }

    item._currentSpan = null;

    if (isFF(FF_DEV_2918)) {
      const htxRanges = item.addRegions(selectedRanges);

      for (const htxRange of htxRanges) {
        const spans = htxRange.createSpans();

        htxRange.addEventsToSpans(spans);
      }
    } else {
      const htxRange = item.addRegion(selectedRanges[0]);

      if (htxRange) {
        const spans = htxRange.createSpans();

        htxRange.addEventsToSpans(spans);
      }
    }
  }

  _handleUpdate() {
    const root = this.myRef.current;
    const { item } = this.props;

    // wait until text is loaded
    if (!item._value) return;

    item.regs.forEach(function(r, i) {
      // spans can be totally missed if this is app init or undo/redo
      // or they can be disconnected from DOM on annotations switching
      // so we have to recreate them from regions data
      if (r._spans?.[0]?.isConnected) return;

      try {
        const phrases = root.children;
        const range = document.createRange();
        const startNode = phrases[r.start].getElementsByClassName(item.layoutClasses.text)[0];
        const endNode = phrases[r.end].getElementsByClassName(item.layoutClasses.text)[0];
        let { startOffset, endOffset } = r;

        range.setStart(...findNodeAt(startNode, startOffset));
        range.setEnd(...findNodeAt(endNode, endOffset));

        if (r.text && range.toString().replace(/\s+/g, '') !== r.text.replace(/\s+/g, '')) {
          console.info('Restore broken position', i, range.toString(), '->', r.text, r);
          if (
            // span breaks the mock-up by its end, so the start of next one is wrong
            item.regs.slice(0, i).some(other => r.start === other.end) &&
            // for now there are no fallback for huge wrong regions
            r.start === r.end
          ) {
            // find region's text in the node (disregarding spaces)
            const match = startNode.textContent.match(new RegExp(r.text.replace(/\s+/g, '\\s+')));

            if (!match) console.warn('Can\'t find the text', r);
            const { index = 0 } = match || {};

            if (r.endOffset - r.startOffset !== r.text.length)
              console.warn('Text length differs from region length; possible regions overlap');
            startOffset = index;
            endOffset = startOffset + r.text.length;

            range.setStart(...findNodeAt(startNode, startOffset));
            range.setEnd(...findNodeAt(endNode, endOffset));
            r.fixOffsets(startOffset, endOffset);
          }
        } else if (!r.text && range.toString()) {
          r.setText(range.toString());
        }

        splitBoundaries(range);

        r._range = range;
        const spans = r.createSpans();

        r.addEventsToSpans(spans);
      } catch (err) {
        console.log(err, r);
      }
    });

    Array.from(this.myRef.current.getElementsByTagName('a')).forEach(a => {
      a.addEventListener('click', function(ev) {
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
    const { item } = this.props;
    const withAudio = !!item.audio;

    // current way to not render when we wait for data
    if (isFF(FF_DEV_2669) && !item._value) return null;

    return (
      <ObjectTag item={item} className={'lsf-paragraphs'}>
        {withAudio && (
          <audio
            controls={item.showplayer && !item.syncedAudio}
            className={styles.audio}
            src={item.audio}
            ref={item.getRef()}
            onEnded={item.reset}
          />
        )}
        {isFF(FF_DEV_2669) && <AuthorFilter item={item} />}
        <div
          ref={this.myRef}
          data-update={item._update}
          className={styles.container}
          onMouseUp={this.onMouseUp.bind(this)}
        >
          <Phrases item={item} />
        </div>
      </ObjectTag>
    );
  }
}

export const HtxParagraphs = inject('store')(observer(HtxParagraphsView));
