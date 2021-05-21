const isTextNode = node => node && node.nodeType === Node.TEXT_NODE;

const isText = text => text && /[\w']/i.test(text);

const destructSelection = selection => {
  const range = selection.getRangeAt(0);
  const { startOffset, startContainer, endOffset, endContainer } = range;

  const firstSymbol = startContainer.textContent[startOffset];
  const prevSymbol = startContainer.textContent[startOffset - 1];
  const lastSymbol = endContainer.textContent[endOffset - 1];
  const nextSymbol = endContainer.textContent[endOffset];

  return {
    selection,
    range,
    startOffset,
    startContainer,
    endOffset,
    endContainer,
    firstSymbol,
    prevSymbol,
    lastSymbol,
    nextSymbol,
  };
};

/**
 *
 * @param {Selection} selection
 */
const wordBoundarySelection = (selection, boundary) => {
  const {
    startOffset,
    startContainer,
    endOffset,
    endContainer,
    firstSymbol,
    prevSymbol,
    lastSymbol,
    nextSymbol,
  } = destructSelection(selection);

  const resultRange = {};
  let currentRange;

  // It's easier to operate the selection when it's collapsed
  selection.collapse(startContainer, startOffset);

  if (!isText(firstSymbol)) {
    if (isText(prevSymbol)) {
      selection.modify("move", "backward", boundary);
    } else {
      selection.modify("move", "forward", boundary);
    }
  } else if (isText(prevSymbol)) {
    selection.modify("move", "backward", boundary);
  }

  currentRange = selection.getRangeAt(0);
  Object.assign(resultRange, {
    startContainer: currentRange.startContainer,
    startOffset: currentRange.startOffset,
  });

  selection.collapse(endContainer, endOffset);

  if (!isText(lastSymbol)) {
    if (isText(nextSymbol)) {
      selection.modify("move", "forward", boundary);
    } else {
      selection.modify("move", "backward", boundary);
    }
  } else if (isText(nextSymbol)) {
    selection.modify("move", "forward", boundary);
  }

  currentRange = selection.getRangeAt(0);
  Object.assign(resultRange, {
    endContainer: currentRange.endContainer,
    endOffset: currentRange.endOffset,
  });

  selection.removeAllRanges();
  const range = new Range();
  range.setStart(resultRange.startContainer, resultRange.startOffset);
  range.setEnd(resultRange.endContainer, resultRange.endOffset);
  selection.addRange(range);

  return selection;
};

const boundarySelection = (selection, boundary) => {
  const wordBoundary = boundary !== "symbol";
  const {
    startOffset,
    startContainer,
    endOffset,
    endContainer,
    firstSymbol,
    prevSymbol,
    lastSymbol,
    nextSymbol,
  } = destructSelection(selection);

  if (wordBoundary) {
    wordBoundarySelection(selection, boundary);
  } else {
    if (!isText(firstSymbol) || isText(prevSymbol)) {
      const newRange = selection.getRangeAt(0);
      newRange.setEnd(startContainer, startOffset);
      selection.modify("move", "backward", boundary);
    }

    if (!isText(lastSymbol) || isText(nextSymbol)) {
      const newRange = selection.getRangeAt(0);
      newRange.setEnd(endContainer, endOffset);
      selection.modify("extend", "forward", boundary);
    }
  }
};

/**
 * Captures current selection
 * @param {(response: {selectionText: string, range: Range}) => void} callback
 */
export const captureSelection = (
  callback,
  { granularity, beforeCleanup } = {
    granularity: "symbol",
  },
) => {
  const selection = window.getSelection();
  const selectionText = selection.toString().replace(/[\n\r]/g, "\\n");

  if (selection.isCollapsed) return;

  applyTextGranularity(selection, granularity);

  for (let i = 0; i < selection.rangeCount; i++) {
    const range = fixRange(selection.getRangeAt(i));
    callback({ selectionText, range });
  }

  // eslint-disable-next-line no-unused-expressions
  beforeCleanup?.();

  selection.removeAllRanges();
};

/**
 * *Experimental feature. Might nor work in Gecko browsers.*
 *
 * Updates selection's granularity.
 * @param {Selection} selection
 * @param {string} granularity
 */
const applyTextGranularity = (selection, granularity) => {
  if (!selection.modify || !granularity || granularity === "symbol") return;

  try {
    switch (granularity) {
      case "word":
        boundarySelection(selection, "word");
        return;
      case "sentence":
        boundarySelection(selection, "sentenceboundary");
        return;
      case "paragraph":
        boundarySelection(selection, "paragraphboundary");
        return;
      case "charater":
      case "symbol":
      default:
        return;
    }
  } catch {
    console.warn("Probably, you're using browser that doesn't support granularity.");
  }
};

/**
 * Lookup closest text node
 * @param {HTMLElement} commonContainer
 * @param {HTMLElement} node
 * @param {number} offset
 */
const textNodeLookup = (commonContainer, node, offset, direction) => {
  const startNode = node === commonContainer ? findOnPosition(node, offset, true).node : node;

  if (isTextNode(startNode)) return startNode;

  let textNode = startNode;

  while (!isTextNode(textNode)) {
    textNode = direction === "forward" ? textNode.nextSibling : textNode.previousSibling;
  }

  return textNode;
};

/**
 * Fix range if it contains non-text nodes
 * @param {Range} range
 */
const fixRange = range => {
  let { startContainer, endContainer, startOffset, endOffset, commonAncestorContainer: commonContainer } = range;

  if (!isTextNode(startContainer)) {
    startContainer = textNodeLookup(commonContainer, startContainer, startOffset, "forward");
    range.setStart(startContainer, 0);
  }

  if (!isTextNode(endContainer)) {
    endContainer = textNodeLookup(commonContainer, endContainer, endOffset, "backward");
    range.setEnd(endContainer, endContainer.length);
  }

  return range;
};

/**
 * Highlight gien Range
 * @param {Range} range
 * @param {{label: string, classNames: string[]}} param1
 */
export const highlightRange = (range, { label, classNames }) => {
  const { startContainer, endContainer, commonAncestorContainer } = range;
  const { startOffset, endOffset } = range;
  const highlights = [];

  /**
   * Wrapper with predefined classNames and cssStyles
   * @param  {[Node, number, number]} args
   */
  const applyStyledHighlight = (...args) => highlightRangePart(...[...args, classNames]);

  // If start and end nodes are equal, we don't need
  // to perform any additional work, just highlighting as is
  if (startContainer === endContainer) {
    highlights.push(applyStyledHighlight(startContainer, startOffset, endOffset));
  } else {
    // When start and end are different we need to find all
    // nodes between as they could contain text nodes
    const nodesToHighlight = findNodesBetween(startContainer, endContainer, commonAncestorContainer);

    // All nodes between start and end should be fully highlighted
    nodesToHighlight.forEach(node => {
      let start = startOffset;
      let end = endOffset;

      if (node !== startContainer) start = 0;
      if (node !== endContainer) end = node.length;

      highlights.push(applyStyledHighlight(node, start, end));
    });
  }

  const lastLabel = highlights[highlights.length - 1];
  lastLabel.setAttribute("data-label", label);

  return highlights;
};

/**
 * Takes original range and splits it into multiple text
 * nodes highlighting a part of the text, then replaces
 * original text node with highlighted one
 * @param {Node} container
 * @param {number} startOffset
 * @param {number} endOffset
 * @param {object} cssStyles
 * @param {string[]} classNames
 */
export const highlightRangePart = (container, startOffset, endOffset, classNames) => {
  let spanHighlight;
  const text = container.textContent;
  const parent = container.parentNode;

  /**
   * In case we're inside another region, move the selection outside
   * to maintain proper nesting of highlight nodes
   */
  if (startOffset === 0 && container.length === endOffset && parent.classList.contains(classNames[0])) {
    const placeholder = document.createElement("span");
    const parentNode = parent.parentNode;

    parentNode.replaceChild(placeholder, parent);
    spanHighlight = wrapWithSpan(parent, classNames);
    parentNode.replaceChild(spanHighlight, placeholder);
  } else {
    // Extract text content that matches offsets
    const content = text.substring(startOffset, endOffset);
    // Create text node that will be highlighted
    const highlitedNode = document.createTextNode(content);

    // Split the container in three parts
    const noseNode = container.cloneNode();
    const tailNode = container.cloneNode();

    // Add all the text BEFORE selection
    noseNode.textContent = text.substring(0, startOffset);
    tailNode.textContent = text.substring(endOffset, text.length);

    // To avoid weird dom mutation we assemble replacement
    // beforehands, it allows to replace original node
    // directly without extra work
    const textFragment = document.createDocumentFragment();
    spanHighlight = wrapWithSpan(highlitedNode, classNames);

    if (noseNode.length) textFragment.appendChild(noseNode);
    textFragment.appendChild(spanHighlight);
    if (tailNode.length) textFragment.appendChild(tailNode);

    // At this point we have three nodes in the tree
    // one of them is our selected range
    parent.replaceChild(textFragment, container);
  }

  return spanHighlight;
};

/**
 * Wrap text node with stylized span
 * @param {Text} node
 * @param {string[]} classNames
 * @param {object} cssStyles
 * @param {string} [label]
 */
export const wrapWithSpan = (node, classNames, label) => {
  const highlight = document.createElement("span");

  highlight.appendChild(node);

  applySpanStyles(highlight, { classNames, label });

  return highlight;
};

/**
 * Apply classes and styles to a span. Optionally add or remove label
 * @param {HTMLSpanElement} spanNode
 * @param {{classNames?: string[], cssStyles?: {}, label?: string}} param1
 */
export const applySpanStyles = (spanNode, { classNames, label }) => {
  if (classNames) {
    spanNode.className = "";
    spanNode.classList.add(...classNames);
  }

  if (label === null) spanNode.removeAttribute("data-label");
  else if (label) spanNode.setAttribute("data-label", label);
};

/**
 * Look up all nodes between given `startNode` and `endNode` including ends
 * @param {Node} startNode
 * @param {Node} endNode
 * @param {Node} root
 */
export const findNodesBetween = (startNode, endNode, root) => {
  // Tree walker creates flat representation of DOM
  // it allows to iterate over nodes more efficiently
  // as we don't need to go up and down on a tree

  // Also we iterate over Text nodes only natively. That's
  // the only type of nodes we need to highlight.
  // No additional checks, long live TreeWalker :)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  // Flag indicates that we're somwhere between `startNode` and `endNode`
  let inRange = false;

  // Here we collect all nodes between start and end
  // including ends
  const nodes = [];
  let { currentNode } = walker;

  while (currentNode) {
    if (currentNode === startNode) inRange = true;
    if (inRange) nodes.push(currentNode);
    if (inRange && currentNode === endNode) break;
    currentNode = walker.nextNode();
  }

  return nodes;
};

/**
 * Removes given range and restores DOM structure.
 * @param {HTMLSpanElement[]} spans
 */
export const removeRange = spans => {
  spans.forEach(hl => {
    const fragment = document.createDocumentFragment();
    const parent = hl.parentNode;

    // Fill replacement fragment
    // We need to copy childNodes because otherwise
    // It will be changed during the loop
    Array.from(hl.childNodes).forEach(node => {
      node.remove();
      fragment.appendChild(node);
    });

    // Put back all text without spans
    parent.replaceChild(fragment, hl);

    // Join back all text nodes
    Array.from(parent.childNodes).forEach(node => {
      const prev = node.previousSibling;

      if (!isTextNode(prev) || !isTextNode(node)) return;

      prev.data += node.data;
      node.remove();
    });
  });
};

/**
 * Find a startContainer and endContainer by text offsets
 * @param {number} start
 * @param {number} end
 * @param {Node} root
 */
export const findRange = (start, end, root) => {
  return {
    startContainer: findOnPosition(root, start),
    endContainer: findOnPosition(root, end),
  };
};

/**
 * Find a node by text offset
 * @param {Node} root
 * @param {number} position
 */
export const findOnPosition = (root, position, byNode = false) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL);

  let lastPosition = position;
  let currentNode = walker.nextNode();

  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE || currentNode.nodeName === "BR") {
      const length = byNode ? 1 : currentNode.length ?? 1;

      if (length >= lastPosition) {
        return { node: currentNode, position: lastPosition };
      } else {
        lastPosition -= length;
      }
    }

    currentNode = walker.nextNode();
  }
};
