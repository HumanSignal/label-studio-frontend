import { createRoot } from 'react-dom/client';
import { configureStore } from './configureStore';
// import { LabelStudio as LabelStudioReact } from './Component';
import { configure } from 'mobx';
import { toCamelCase } from 'strman';
import legacyEvents from './core/External';
import { Hotkey } from './core/Hotkey';
import defaultOptions from './defaultOptions';
import { Events } from './utils/events';
import { isDefined } from './utils/utilities';
// import { destroy as destroySharedStore } from './mixins/SharedChoiceStore/mixin';
import { createElement } from 'react';
import { Store } from 'src/Engine/Atoms/Store';
import { Root } from './App';
import { CommunicationBus } from './core/CommunicationBus/CommunicationBus';
import { InternalSDK } from './core/SDK/Internal/Internal.sdk';
import { LSOptions } from './Types/LabelStudio/LabelStudio';

configure({
  isolateGlobalState: true,
});

const INTERNAL_SDK = Symbol('INTERNAL_SDK');
const APP_ROOT = Symbol('APP_ROOT');
const STORE = Symbol('STORE');

const ROOTS = new Set<HTMLElement>();

const INSTANCES = new WeakMap<HTMLElement, LabelStudio>();

const SDK = new WeakMap<LabelStudio, InternalSDK>();

export class LabelStudio {
  private events: Events;
  private options: LSOptions;
  private [INTERNAL_SDK]!: InternalSDK;
  private [APP_ROOT]!: ReturnType<typeof createRoot>;
  private [STORE]!: Store;

  root: HTMLElement | string;

  get internalSDK() { return this[INTERNAL_SDK]; }

  get store() { return this[STORE]; }

  constructor(
    root: string | HTMLElement,
    userOptions: LSOptions = {},
  ) {
    const options: LSOptions = {};

    Object.assign(
      options,
      (defaultOptions as LSOptions),
      (userOptions ?? {}) as LSOptions,
    );

    if (options.keymap) {
      Hotkey.setKeymap(options.keymap);
    }

    this.root = root;
    this.events = new Events();
    this.options = options ?? {};
    this.destroy = (() => { /* noop */ });

    this.supportLgacyEvents();
    this.createApp();
  }

  on(eventName: string, callback: () => void) {
    this.events.on(eventName, callback);
  }

  off(eventName: string, callback: () => void) {
    if (isDefined(callback)) {
      this.events.off(eventName, callback);
    } else {
      this.events.removeAll(eventName);
    }
  }

  destroy() {
    this.destroy = (() => {});
    this[INTERNAL_SDK].destroy();
    this[APP_ROOT].unmount();
  }

  private async createApp() {
    const { getRoot, params } = await configureStore(this.options);
    const rootElement = getRoot(this.root) as unknown as HTMLElement;
    const appRoot = this.initAppRoot(rootElement);
    const CB = new CommunicationBus();

    const store = new Store();
    const internalSDK = new InternalSDK({
      store,
      events: this.events,
      communicationBus: CB,
    });

    const hydrateStore = () => {
      internalSDK.hydrate({
        config: params.config,
        interfaces: params.interfaces,
        user: params.user,
        task: params.task,
        users: params.users,
        forceAutoAnnotation: params.forceAutoAnnotation,
        forceAutoAcceptSuggestions: params.forceAutoAcceptSuggestions,
      });
    };

    const app = createElement(Root, {
      store,
      sdk: internalSDK,
      afterInit: hydrateStore,
    });

    appRoot.render(app);

    ROOTS.add(rootElement);
    INSTANCES.set(rootElement, this);

    this[INTERNAL_SDK] = internalSDK;
    this[APP_ROOT] = appRoot;
    this[STORE] = store;
  }

  private initAppRoot(rootElement: HTMLElement) {
    return createRoot(rootElement);
  }

  private supportLgacyEvents() {
    const keys = Object.keys(legacyEvents) as (keyof typeof legacyEvents)[];

    keys.forEach(key => {
      const callback = this.options[key];

      if (isDefined(callback)) {
        const eventName = toCamelCase(key.replace(/^on/, ''));

        this.events.on(eventName, callback);
      }
    });
  }
}

export const onlyInstance = () => {
  return INSTANCES.get(ROOTS.values().next().value);
};

export const getSDK = (ls: LabelStudio) => {
  return SDK.get(ls);
};

export const getInstance = (root: HTMLElement) => {
  return INSTANCES.get(root);
};

export const destroyAll = () => {
  ROOTS.forEach(root => {
    const instance = getInstance(root);

    instance?.destroy();

    INSTANCES.delete(root);
  });

  ROOTS.clear();
};

export const create = function(...args: ConstructorParameters<typeof LabelStudio>) {
  return new LabelStudio(...args);
};
