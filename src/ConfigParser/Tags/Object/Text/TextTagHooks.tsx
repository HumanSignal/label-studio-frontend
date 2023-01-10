import { useAutoAnnotation } from '@atoms/Models/RootAtom/Hooks';
import { useCallback, useRef } from 'react';
import Utils from 'src/utils';
import { cn } from 'src/utils/bem';
import { htmlEscape } from 'src/utils/html';
import * as xpath from 'xpath-range';
import { TextTagViewController } from './TextTagTypes';

const REGION_SPAN_SELECTOR = '.htx-highlight';
const DBLCLICK_TIMEOUT = 450; // ms
const DBLCLICK_RANGE = 5; // px

type DoubleClickSelection = {
  time: number,
  value?: string[],
  x: number,
  y: number,
}

/**
 * Gathers the text value from the `value` attribute
 * The value is pre-processed on the attribute parsing level
 */
export const useTextValue = (initialValue: string | undefined, isText: boolean) => {
  let transformedValue: string | undefined;

  if (!initialValue) return transformedValue;

  if (isText) {
    const newLineReplacement = '<br/>';
    const cnLine = cn('richtext', { elem: 'line' });

    transformedValue = htmlEscape(initialValue)
      .split(/\n|\r/g)
      .map(s => `<span class="${cnLine}">${s}</span>`)
      .join(newLineReplacement);
  }

  return transformedValue ?? initialValue;
};

type TextHandlers = {
  onRegionClick: (ev: MouseEvent) => void,
  onMouseUp: (ev: MouseEvent) => void,
  onRegionMouseOver: (ev: MouseEvent) => void,
  passHotkeys: (ev: KeyboardEvent) => void,
}

/**
 * Creates necessary event listeners for the text tag
 */
export const useTextHandlers = (
  item: null,
  // controller: TextTagViewController,
): TextHandlers => {
  const autoAnnotation = useAutoAnnotation();
  const doubleClickSelection = useRef<DoubleClickSelection | null>(null);
  const selectionMode = useRef<boolean>(false);

  /**
   * Helper method to find regions in the text
   */
  const determineRegion = (element: HTMLElement) => {
    if (Utils.HTML.matchesSelector(element, REGION_SPAN_SELECTOR)) {
      const span = element.tagName === 'SPAN' ? element : element.closest(REGION_SPAN_SELECTOR);

      return item.regs.find(region => region.find(span));
    }
  };

  const onMouseUp = useCallback((ev: MouseEvent) => {
    const states = item.activeStates();
    const rootEl = item.visibleNodeRef.current;
    const root = rootEl?.contentDocument?.body ?? rootEl;

    if (!states || states.length === 0 || ev.ctrlKey || ev.metaKey) {
      return this._selectRegions(ev.ctrlKey || ev.metaKey);
    }

    if (item.selectionenabled === false || !item.annotation.editable) return;
    const label = states[0]?.selectedLabels?.[0];
    const value = states[0]?.selectedValues?.();

    Utils.Selection.captureSelection(({ selectionText, range }) => {
      if (!range || range.collapsed || !root.contains(range.startContainer) || !root.contains(range.endContainer)) {
        return;
      }

      Utils.Selection.fixCodePointsInRange(range);

      const normedRange = xpath.fromRange(range, root);

      if (!normedRange) return;

      if (doubleClickSelection.current && (
        Date.now() - doubleClickSelection.current.time > DBLCLICK_TIMEOUT
        || Math.abs(ev.pageX - doubleClickSelection.current.x) > DBLCLICK_RANGE
        || Math.abs(ev.pageY - doubleClickSelection.current.y) > DBLCLICK_RANGE
      )) {
        doubleClickSelection.current = null;
      }

      item.addRegion({
        ...normedRange,
        _range: range,
        text: selectionText,
        isText: item.type === 'text',
        dynamic: autoAnnotation,
      }, doubleClickSelection.current);
    }, {
      window: rootEl?.contentWindow ?? window,
      granularity: label?.granularity ?? item.granularity,
      beforeCleanup: () => {
        doubleClickSelection.current = null;
        selectionMode.current = true;
      },
    });

    doubleClickSelection.current = {
      time: Date.now(),
      value: value?.length ? value : undefined,
      x: ev.pageX,
      y: ev.pageY,
    };
  }, [autoAnnotation]);

  const onRegionClick = (event: MouseEvent) => {
    if (selectionMode.current) {
      selectionMode.current = false;
      return;
    }

    const target = event.target as HTMLElement;

    if (!item.clickablelinks && Utils.HTML.matchesSelector(target, 'a[href]')) {
      event.preventDefault();
      return;
    }

    const region = determineRegion(target);

    if (!region) return;
    region && region.onClickRegion(event);
    event.stopPropagation();
  };

  /**
   * @param {MouseEvent} event
   */
  const onRegionMouseOver = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const region = determineRegion(target);

    item.setHighlight(region);
  };

  const passHotkeys = (e: KeyboardEvent) => {
    const props = ['key', 'code', 'keyCode', 'location', 'ctrlKey', 'shiftKey', 'altKey', 'metaKey'];
    const init: Record<string, any> = {};

    for (const prop of props) init[prop] = e[prop as keyof KeyboardEvent];

    const internal = new KeyboardEvent(e.type, init);

    document.dispatchEvent(internal);
  };

  return {
    onMouseUp,
    onRegionClick,
    onRegionMouseOver,
    passHotkeys,
  };
};

/**
 * Event listener to handle iFrame onLoad event.
 * Used when the `inline` attribute set to true
 */
export const useIFrameHandler = (
  item: null,
  controller: TextTagViewController,
  handlers: TextHandlers,
) => {
  const onIframeLoad = useCallback(() => {
    const iframe = controller.visibleNodeRef.current;
    const doc = iframe?.contentDocument;
    const body = doc?.body;
    const htmlEl = body?.parentElement;
    const eventHandlers: any = {
      click: [handlers.onRegionClick, true],
      keydown: [handlers.passHotkeys, false],
      keyup: [handlers.passHotkeys, false],
      keypress: [handlers.passHotkeys, false],
      mouseup: [handlers.onMouseUp, false],
      mouseover: [handlers.onRegionMouseOver, true],
    };

    if (!body) return;

    for (const eventName in eventHandlers) {
      const handler = eventHandlers[eventName];
      const [listener, useCapture] = handler;

      body.addEventListener(eventName, listener, useCapture);
    }

    // @todo remove this, project-specific
    // fix unselectable links
    const style = doc.createElement('style');

    style.textContent = 'body a[href] { pointer-events: all; }';
    doc.head.appendChild(style);

    // // @todo make links selectable; dragstart supressing doesn't help — they are still draggable
    // body.addEventListener("dragstart", e => {
    //   e.stopPropagation();
    //   e.preventDefault();
    // });

    // auto-height
    if (body.scrollHeight) {
      // body dimensions sometimes doesn't count some inner content offsets
      // but html's offsetHeight sometimes is zero, so get the max of both
      iframe.style.height = Math.max(body.scrollHeight, htmlEl.offsetHeight) + 'px';
    }

    this.markObjectAsLoaded();
  }, []);

  return onIframeLoad;
};
