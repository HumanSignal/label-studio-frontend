import { render, unmountComponentAtNode } from 'react-dom';
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

configure({
  isolateGlobalState: true,
});

function cutFibers(object) {
  const objects = [object];
  let obj;

  while ((obj = objects.pop())) {
    const keys = Object.keys(obj);

    for (const key of keys) {
      const prop = obj[key];

      if (prop && typeof prop === 'object' && {}.hasOwnProperty.call(prop, 'stateNode')) {
        objects.push(obj[key]);
        obj[key] = null;
      }
    }
  }
}

function findReactKey(node) {
  const keys = Object.keys(node);

  for (const key of keys) {
    const match = key.match(/^__reactProps(\$[^$]+)$/);

    if (match) {
      return match[1];
    }
  }
  return '';
}

function cleanDomAfterReact(nodes, reactKey) {
  for (const node of nodes) {
    const reactPropKeys = (Object.keys(node)).filter(key => key.startsWith('__react') && (!key.match(/^__reactProps|__reactFiber/) || key.match(new RegExp(`\\${reactKey}$`))));

    if (reactPropKeys.length) {
      for (const key of reactPropKeys) {
        cutFibers(node[key]);
        node[key] = null;
      }
      if (node.childNodes) {
        cleanDomAfterReact(node.childNodes, reactKey);
      }
    }
  }
}

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

    this.store = store;
    window.Htx = this.store;

    const isRendered = false;

    const renderApp = () => {
      if (isRendered) {
        clearRenderedApp();
      }
      render((
        <App
          store={this.store}
          panels={registerPanels(this.options.panels) ?? []}
        />
      ), rootElement);
    };

    const clearRenderedApp = () => {
      const childNodes = [...rootElement.childNodes];
      // We need this key to be sure that cleaning will affect only current react subtree
      const reactKey = findReactKey(childNodes[0]);

      unmountComponentAtNode(rootElement);
      /*
              Unmounting does not help with clearing React's fibers
              but removing the manually helps
              @see https://github.com/facebook/react/pull/20290 (similar problem)
              That's maybe not relevant in version 18
             */
      cleanDomAfterReact(childNodes, reactKey);
      cleanDomAfterReact([rootElement], reactKey);
    };

    renderApp();
    store.setAppControls({
      render: renderApp,
      clear: clearRenderedApp,
    });

    this.destroy = () => {
      clearRenderedApp();
      destroySharedStore();
      /*
         It seems that destroying children separately helps GC to collect garbage
         as well as nulling all these this.store
       */
      this.store.selfDestroy();
      destroy(this.store);
      this.store = null;
      this.destroy = null;
      this.constructor.instances.delete(this);
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
