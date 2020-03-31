import insertAfter from "insert-after";
import * as Checkers from "./utilities";
import Canvas from "./canvas";

function toggleLabelsAndScores(show) {
  const els = document.getElementsByClassName("htx-highlight");
  Array.from(els).forEach(el => {
    let foundCls = null;
    Array.from(el.classList).forEach(cls => {
      if (cls.indexOf("htx-label-") !== -1) foundCls = cls;
    });

    if (foundCls !== null) {
      if (show) el.classList.remove("htx-no-label");
      else el.classList.add("htx-no-label");
    }
  });
}

function labelWithCSS(node, { labels, score }) {
  const labelsStr = labels ? labels.join(",") : "";
  const clsName = Checkers.hashCode(labelsStr + score);

  let cssCls = "htx-label-" + clsName;
  cssCls = cssCls.toLowerCase();

  node.setAttribute("data-labels", labelsStr);

  const resSVG = Canvas.labelToSVG({ label: labelsStr, score: score });
  const svgURL = `url(${resSVG})`;

  createClass(`.${cssCls}:after`, `content:${svgURL}`);

  return cssCls;
}

// work directly with the html tree
function createClass(name, rules) {
  var style = document.createElement("style");
  style.type = "text/css";
  document.getElementsByTagName("head")[0].appendChild(style);
  if (!(style.sheet || {}).insertRule) (style.styleSheet || style.sheet).addRule(name, rules);
  else style.sheet.insertRule(name + "{" + rules + "}", 0);
}

function documentForward(node) {
  if (node.firstChild) return node.firstChild;

  while (!node.nextSibling) {
    node = node.parentNode;
    if (!node) return null;
  }

  return node.nextSibling;
}

function isTextNode(node) {
  const TEXT_NODE = 3;
  return node.nodeType === TEXT_NODE;
}

function firstLeaf(node) {
  while (node.hasChildNodes()) node = node.firstChild;
  return node;
}

/* Find the last leaf node. */
function lastLeaf(node) {
  while (node.hasChildNodes()) node = node.lastChild;

  return node;
}

function getNextNode(node) {
  if (node.firstChild) return node.firstChild;
  while (node) {
    if (node.nextSibling) return node.nextSibling;
    node = node.parentNode;
  }
}

function getNodesInRange(range) {
  var start = range.startContainer;
  var end = range.endContainer;
  var commonAncestor = range.commonAncestorContainer;
  var nodes = [];
  var node;

  // walk parent nodes from start to common ancestor
  for (node = start.parentNode; node; node = node.parentNode) {
    nodes.push(node);
    if (node === commonAncestor) break;
  }
  nodes.reverse();

  // walk children and siblings from start until end is found
  for (node = start; node; node = getNextNode(node)) {
    nodes.push(node);
    if (node === end) break;
  }

  return nodes;
}

function documentReverse(node) {
  if (node.lastChild) return node.lastChild;

  while (!node.previousSibling) {
    node = node.parentNode;
    if (!node) return null;
  }

  return node.previousSibling;
}

function splitText(node, offset) {
  let tail = node.cloneNode(false);
  tail.deleteData(0, offset);
  node.deleteData(offset, node.length - offset);
  return insertAfter(tail, node);
}

function normalizeBoundaries(range) {
  let { startContainer, startOffset, endContainer, endOffset } = range;
  let node, next, last, start, end;

  // Move the start container to the last leaf before any sibling boundary,
  // guaranteeing that any children of the container are within the range.
  if (startContainer.childNodes.length && startOffset > 0) {
    startContainer = lastLeaf(startContainer.childNodes[startOffset - 1]);
    startOffset = startContainer.length || startContainer.childNodes.length;
  }

  // Move the end container to the first leaf after any sibling boundary,
  // guaranteeing that any children of the container are within the range.
  if (endOffset < endContainer.childNodes.length) {
    endContainer = firstLeaf(endContainer.childNodes[endOffset]);
    endOffset = 0;
  }

  // Any TextNode in the traversal is valid unless excluded by the offset.
  function isTextNodeInRange(node) {
    if (!isTextNode(node)) return false;
    if (node === startContainer && startOffset > 0) return false;
    if (node === endContainer && endOffset === 0) return false;
    return true;
  }

  // Find the start TextNode.
  // The guarantees above provide that a document order traversal visits every
  // Node in the Range before visiting the last leaf of the end container.
  node = startContainer;
  next = node => (node === last ? null : documentForward(node));
  last = lastLeaf(endContainer);
  while (node && !isTextNodeInRange(node)) node = next(node);
  start = node;

  // Find the end TextNode.
  // Similarly, a reverse document order traversal visits every Node in the
  // Range before visiting the first leaf of the start container.
  node = endContainer;
  next = node => (node === last ? null : documentReverse(node));
  last = firstLeaf(startContainer);
  while (node && !isTextNodeInRange(node)) node = next(node);
  end = node;

  range.setStart(start, 0);
  range.setEnd(end, end.length);
}

function highlightRange(normedRange, cssClass, cssStyle) {
  if (typeof cssClass === "undefined" || cssClass === null) {
    cssClass = "htx-annotation";
  }

  const allNodes = getNodesInRange(normedRange._range);
  const textNodes = allNodes.filter(n => isTextNode(n));

  var white = /^\s*$/;

  var nodes = textNodes; // normedRange.textNodes(),

  let nlen = nodes.length;
  if (nlen > 1 && nodes[nodes.length - 1].length !== normedRange._range.endOffset) nlen = nlen - 1;

  const results = [];
  for (var i = 0, len = nlen; i < len; i++) {
    var node = nodes[i];
    if (!white.test(node.nodeValue)) {
      var hl = window.document.createElement("span");
      hl.style.backgroundColor = cssStyle.backgroundColor;

      hl.className = cssClass;
      node.parentNode.replaceChild(hl, node);
      hl.appendChild(node);

      results.push(hl);
    }
  }

  return results;
}

function splitBoundaries(range) {
  let { startContainer, startOffset, endContainer, endOffset } = range;

  if (isTextNode(endContainer)) {
    if (endOffset > 0 && endOffset < endContainer.length) {
      endContainer = splitText(endContainer, endOffset);
      range.setEnd(endContainer, 0);
    }
  }

  if (isTextNode(startContainer)) {
    if (startOffset > 0 && startOffset < startContainer.length) {
      if (startContainer === endContainer) {
        startContainer = splitText(startContainer, startOffset);
        range.setEnd(startContainer, endOffset - startOffset);
      } else {
        startContainer = splitText(startContainer, startOffset);
      }
      range.setStart(startContainer, 0);
    }
  }
}

const toGlobalOffset = (container, element, len) => {
  let pos = 0;
  const count = node => {
    if (node === element) {
      return pos;
    }
    if (node.nodeName === "#text") pos = pos + node.length;
    if (node.nodeName === "BR") pos = pos + 1;

    for (var i = 0; i <= node.childNodes.length; i++) {
      const n = node.childNodes[i];
      if (n) {
        const res = count(n);
        if (res !== undefined) return res;
      }
    }
  };

  return len + count(container);
};

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
    if (node.nodeName === "#text") {
      if (node !== range.startContainer && !passedStart) start = start + node.length;
      if (node === range.startContainer) passedStart = true;

      if (node !== range.endContainer && !passedEnd) end = end + node.length;
      if (node === range.endContainer) passedEnd = true;
    }

    if (node.nodeName === "BR") {
      if (!passedStart) start = start + 1;

      if (!passedEnd) end = end + 1;
    }

    if (node.childNodes.length > 0) {
      for (var i = 0; i <= node.childNodes.length; i++) {
        const n = node.childNodes[i];

        if (n) {
          const res = traverse(n);
          if (res) return res;
        }
      }
    }
  };

  traverse(element);

  return { start: start, end: end };
};

const findIdxContainer = (el, globidx) => {
  let len = globidx;

  const traverse = node => {
    if (!node) return;

    if (node.nodeName === "#text") {
      if (len - node.length <= 0) return node;
      else len = len - node.length;
    } else if (node.nodeName === "BR") {
      len = len - 1;
    } else if (node.childNodes.length > 0) {
      for (var i = 0; i <= node.childNodes.length; i++) {
        const n = node.childNodes[i];

        if (n) {
          const res = traverse(n);
          if (res) return res;
        }
      }
    }
  };

  const node = traverse(el);

  return { node, len };
};

function removeSpans(spans) {
  var norm = [];

  if (spans) {
    spans.forEach(span => {
      while (span.firstChild) span.parentNode.insertBefore(span.firstChild, span);

      norm.push(span.parentNode);
      span.parentNode.removeChild(span);
    });
  }

  norm.forEach(n => n.normalize());
}

export {
  toggleLabelsAndScores,
  labelWithCSS,
  removeSpans,
  mainOffsets,
  findIdxContainer,
  toGlobalOffset,
  highlightRange,
  splitBoundaries,
  normalizeBoundaries,
  createClass,
};
