import Canvas from './canvas';
import * as Checkers from './utilities';

/** Inserts node after a given reference */
function insertAfter(node: Node, ref: Node) {
  const nextSibling = ref.nextSibling;
  const parentNode = ref.parentNode;

  return parentNode?.insertBefore(node, nextSibling);
}

// fast way to change labels visibility for all text regions
function toggleLabelsAndScores(show: boolean) {
  const toggleInDocument = (document: Document) => {
    const els = document.getElementsByClassName('htx-highlight');

    Array.from(els).forEach(el => {
      // labels presence controlled by explicit `showLabels` in the config
      if (el.classList.contains('htx-manual-label')) return;

      if (show) el.classList.remove('htx-no-label');
      else el.classList.add('htx-no-label');
    });
  };

  toggleInDocument(document);

  const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe.lsf-htx-richtext');

  iframes.forEach((iframe) => {
    toggleInDocument(iframe.contentDocument!);
  });
}

const labelWithCSS = (function() {
  const cache: Record<string, boolean> = {};

  return function(node: Element, {
    labels,
    score,
  }: {
    labels?: string[],
    score: number,
  }) {
    const labelsStr = labels ? labels.join(',') : '';
    const clsName = Checkers.hashCode(labelsStr + score);

    let cssCls = 'htx-label-' + clsName;

    cssCls = cssCls.toLowerCase();

    if (cssCls in cache) return cache[cssCls];

    node.setAttribute('data-labels', labelsStr);

    const resSVG = Canvas.labelToSVG({ label: labelsStr, score });
    const svgURL = `url(${resSVG})`;

    createClass(`.${cssCls}:after`, `content:${svgURL}`);

    cache[clsName] = true;

    return cssCls;
  };
})();

// work directly with the html tree
function createClass(name: string, rules: string) {
  const style = document.createElement('style');

  document.getElementsByTagName('head')[0].appendChild(style);

  if (style.sheet) {
    style.sheet.insertRule(`${name}{${rules}}`, 0);
  }
}


function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function getNextNode(node: Element | Node) {
  if (node.firstChild) return node.firstChild;
  while (node) {
    if (node.nextSibling) return node.nextSibling;
    node = node.parentNode as Element;
  }
}

function getNodesInRange(range: Range) {
  const start = range.startContainer;
  const end = range.endContainer;
  const commonAncestor = range.commonAncestorContainer;
  const nodes = [];
  let node;

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

/**
 * Split text node into two nodes following each other
 * @param {Text} node
 * @param {number} offset
 */
function splitText(node: Text, offset: number) {
  const tail = node.cloneNode(false) as Text;

  tail.deleteData(0, offset);
  node.deleteData(offset, node.length - offset);
  return insertAfter(tail, node) as Element;
}

function highlightRange(
  normedRange: { _range: Range },
  cssClass: string,
  cssStyle: CSSStyleDeclaration,
) {
  if (typeof cssClass === 'undefined' || cssClass === null) {
    cssClass = 'htx-annotation';
  }

  const allNodes = getNodesInRange(normedRange._range);
  const textNodes = allNodes.filter(n => isTextNode(n as Element)) as Text[];

  const white = /^\s*$/;

  const nodes = textNodes; // normedRange.textNodes(),

  let start = 0;

  if (normedRange._range.startOffset === nodes[start].length) start++;

  let nlen = nodes.length;

  if (nlen > 1 && nodes[nodes.length - 1].length !== normedRange._range.endOffset) nlen = nlen - 1;

  const results = [];

  for (let i = start, len = nlen; i < len; i++) {
    const node = nodes[i];
    const value = node.nodeValue;

    if (typeof value === 'string' && !white.test(value)) {
      const hl = window.document.createElement('span');

      hl.style.backgroundColor = cssStyle.backgroundColor;

      hl.className = cssClass;
      node.parentNode?.replaceChild(hl, node);
      hl.appendChild(node);

      results.push(hl);
    }

    white.lastIndex = 0;
  }

  return results;
}

/**
 *
 * @param {Range} range
 */
function splitBoundaries(range: Range) {
  let startContainer = range.startContainer as Element;
  let endContainer = range.endContainer as Element;
  const { startOffset, endOffset } = range;

  if (isTextNode(endContainer)) {
    if (endOffset > 0 && endOffset < endContainer.length) {
      const newEndContainer = splitText(endContainer, endOffset);

      if (newEndContainer) {
        endContainer = newEndContainer;
        range.setEnd(endContainer, 0);
      }
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

function removeSpans(spans: Element[]) {
  const norm: Element[] = [];

  if (spans) {
    spans.forEach(span => {
      while (span.firstChild) span.parentNode?.insertBefore(span.firstChild, span);

      norm.push(span.parentNode as Element);
      span.parentNode?.removeChild(span);
    });
  }

  norm.forEach(n => n.normalize());
}

function moveStylesBetweenHeadTags(
  srcHead: HTMLHeadElement,
  destHead: HTMLHeadElement,
) {
  const rulesByStyleId: Record<string, string[]> = {};
  const fragment = document.createDocumentFragment();
  const styleTags = srcHead.querySelectorAll('style');

  for (const style of styleTags) {
    const styleSheet = style.sheet!;

    // Sometimes rules are not accessible
    try {
      const rules = styleSheet.rules;

      const cssTexts: string[] = rulesByStyleId[style.id] = [];

      for (let k = 0;k < rules.length; k++) {
        cssTexts.push(rules[k].cssText);
      }
    } finally {
      fragment.appendChild(style);
    }
  }

  destHead.appendChild(fragment);
  applyHighlightStylesToDoc(destHead.ownerDocument,rulesByStyleId);
}

function applyHighlightStylesToDoc(
  destDoc: Document,
  rulesByStyleId: Record<string, string[]>,
) {
  for (let i = 0; i < destDoc.styleSheets.length; i++) {
    const styleSheet = destDoc.styleSheets[i];
    const style = styleSheet.ownerNode as HTMLStyleElement;

    if (!style.id) continue;
    // Sometimes rules are not accessible
    try {
      const rules = rulesByStyleId[style.id];

      if (!rules) continue;

      for (const rule of rules) style.sheet?.insertRule(rule);
    } catch {
      continue;
    }
  }
}

/**
 * Checks if element or one of its descendants match given selector
 * @param {HTMLElement} element Element to match
 * @param {string} selector CSS selector
 */
export const matchesSelector = (element: Element, selector: string) => {
  return element.matches(selector) || element.closest(selector) !== null;
};

/**
 * Find a node by xpath
 * @param {string} xpath
 * @param {Node} root
 */
export const findByXpath = (xpath: string, root = document) => {
  if (root !== document && xpath[0] !== '.') {
    xpath = `.${xpath}`;
  }

  return document.evaluate(xpath, root, null, XPathResult.ANY_TYPE, null).iterateNext();
};

export const htmlEscape = (string: string) => {
  const matchHtmlRegExp = /["'&<>]/;
  const str = '' + string;
  const match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  let escape;
  let html = '';
  let index = 0;
  let lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;';
        break;
      case 38: // &
        escape = '&amp;';
        break;
      case 39: // '
        escape = '&#39;';
        break;
      case 60: // <
        escape = '&lt;';
        break;
      case 62: // >
        escape = '&gt;';
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
};

function findNodeAt(context: Element, at: number): [Element | null, number] {
  for (let node = context.firstChild, l = 0; node; ) {
    const textContent = node.textContent!;

    if (textContent.length + l < at){
      l += textContent.length;
      node = node.nextSibling;
      continue;
    }

    if (!node.firstChild) return [node as Element, at - l];

    node = node.firstChild;
  }

  return [null, 0];
}

export {
  toggleLabelsAndScores,
  labelWithCSS,
  findNodeAt,
  removeSpans,
  highlightRange,
  splitBoundaries,
  createClass,
  moveStylesBetweenHeadTags,
  applyHighlightStylesToDoc
};
