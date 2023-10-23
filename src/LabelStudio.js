import { createRoot } from 'react-dom/client';
import App from './components/App/App';
import { configureStore } from './configureStore';
import { LabelStudio as LabelStudioReact } from './Component';
import { registerPanels } from './registerPanels';
import { configure } from 'mobx';
import { EventInvoker } from './utils/events';
import legacyEvents from './core/External';
import { toCamelCase } from 'strman';
import { isDefined } from './utils/utilities';
import { Hotkey } from './core/Hotkey';
import defaultOptions from './defaultOptions';
import { destroy } from 'mobx-state-tree';
import { destroy as destroySharedStore } from './mixins/SharedChoiceStore/mixin';
import { cleanDomAfterReact, findReactKey } from './utils/reactCleaner';
import { FF_LSDV_4620_3_ML, isFF } from './utils/feature-flags';
import { StrictMode } from 'react';

configure({
  isolateGlobalState: true,
});

export class LabelStudio {
  static instances = new Set();

  static destroyAll() {
    this.instances.forEach(inst => inst.destroy?.());
    this.instances.clear();
  }

  constructor(root, userOptions = {}) {
    const options = Object.assign({}, defaultOptions, userOptions ?? {});

    if (options.keymap) {
      Hotkey.setKeymap(options.keymap);
    }

    this.root = root;
    this.events = new EventInvoker();
    this.options = options ?? {};
    this.destroy = (() => { /* noop */ });

    this.supportLgacyEvents(options);
    this.createApp();

    this.constructor.instances.add(this);
  }

  on(...args) {
    this.events.on(...args);
  }

  off(eventName, callback) {
    if (isDefined(callback)) {
      this.events.off(eventName, callback);
    } else {
      this.events.removeAll(eventName);
    }
  }

  async createApp() {
    const { store, getRoot } = await configureStore(this.options, this.events);
    const rootElement = getRoot(this.root);
    const appRoot = createRoot(rootElement);

    this.store = store;
    window.Htx = this.store;

    const isRendered = false;

    const renderApp = () => {
      if (isRendered) {
        unmountApp();
      }
      appRoot.render(
        <StrictMode>
          <App
            store={this.store}
            panels={registerPanels(this.options.panels) ?? []}
          />
        </StrictMode>,
      );
    };

    const PERFORM_REACT_CLEANUP = true;

    const cleanupReactNodes = (callback) => {
      let childNodes, reactKey;

      if (PERFORM_REACT_CLEANUP) {
        childNodes = Array.from(rootElement.childNodes);
        console.log(childNodes);

        // cleanDomAfterReact needs this key to be sure that cleaning affects
        // only current react subtree
        reactKey = findReactKey(childNodes[0]);
      }

      callback();

      /*
        Unmounting doesn't help with clearing React's fibers
        but removing the manually helps
        @see https://github.com/facebook/react/pull/20290 (similar problem)
        That's maybe not relevant in version 18
       */
      if (childNodes && reactKey) {
        cleanDomAfterReact(childNodes, reactKey);
        cleanDomAfterReact([rootElement], reactKey);
      }
    };

    const unmountApp = () => {
      cleanupReactNodes(() => {
        appRoot.unmount();
      });
    };

    renderApp();
    store.setAppControls({
      isRendered() {
        return isRendered;
      },
      render: renderApp,
      clear: unmountApp,
    });

    this.destroy = () => {
      if (isFF(FF_LSDV_4620_3_ML)) {
        unmountApp();
      }
      destroySharedStore();
      if (isFF(FF_LSDV_4620_3_ML)) {
        /*
           It seems that destroying children separately helps GC to collect garbage
           ...
         */
        this.store.selfDestroy();
      }
      destroy(this.store);
      if (isFF(FF_LSDV_4620_3_ML)) {
        /*
            ...
            as well as nulling all these this.store
         */
        this.store = null;
        this.destroy = null;
        this.constructor.instances.delete(this);
      }
    };
  }

  supportLgacyEvents() {
    const keys = Object.keys(legacyEvents);

    keys.forEach(key => {
      const callback = this.options[key];

      if (isDefined(callback)) {
        const eventName = toCamelCase(key.replace(/^on/, ''));

        this.events.on(eventName, callback);
      }
    });
  }
}

LabelStudio.Component = LabelStudioReact;
