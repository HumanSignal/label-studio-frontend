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
        cleanDomAfterReact(node.childNodes);
      }
    }
  }
}

export class LabelStudio {
  static instances = new Set();

  static destroyAll() {
    this.instances.forEach(inst => inst.destroy());
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

    render((
      <App
        store={this.store}
        panels={registerPanels(this.options.panels) ?? []}
      />
    ), rootElement);

    const destructor = () => {
      const childNodes = [...rootElement.childNodes];
      const reactKey = findReactKey(childNodes[0]);

      unmountComponentAtNode(rootElement);
      cleanDomAfterReact(childNodes, reactKey);
      cleanDomAfterReact([rootElement], reactKey);
      destroySharedStore();
      this.store.selfDestroy();
      destroy(this.store);
      this.store = null;
      this.destroy = null;
    };

    this.destroy = destructor;
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
