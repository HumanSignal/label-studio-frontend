import { createRoot } from 'react-dom/client';
import { configureStore } from './configureStore';
// import { LabelStudio as LabelStudioReact } from './Component';
import { configure } from 'mobx';
import { destroy } from 'mobx-state-tree';
import { toCamelCase } from 'strman';
import legacyEvents from './core/External';
import { Hotkey } from './core/Hotkey';
import defaultOptions from './defaultOptions';
import { EventInvoker } from './utils/events';
import { isDefined } from './utils/utilities';
// import { destroy as destroySharedStore } from './mixins/SharedChoiceStore/mixin';
import { Store } from '@atoms/Store';
import { App } from './App';
import { InternalSDK } from './core/SDK/Internal/Internal.sdk';
import { LSOptions } from './Types/LabelStudio/LabelStudio';

configure({
  isolateGlobalState: true,
});

const INTERNAL_SDK = Symbol('INTERNAL_SDK');

export class LabelStudio {
  // static Component = LabelStudioReact;

  static instances = new Set<LabelStudio>();

  static destroyAll() {
    this.instances.forEach(inst => inst.destroy?.());
    this.instances.clear();
  }

  private root: HTMLElement | string;
  private events: EventInvoker;
  private options: LSOptions;
  private [INTERNAL_SDK]!: InternalSDK;

  store: any;
  destroy: (() => void) | null;

  constructor(root: string | HTMLElement, userOptions: LSOptions = {}) {
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
    this.events = new EventInvoker();
    this.options = options ?? {};
    this.destroy = (() => { /* noop */ });

    this.supportLgacyEvents();
    this.createApp();

    LabelStudio.instances.add(this);
  }

  on(eventName: string, callback: () => void) {
    this.events.on(eventName, callback);
  }

  off(eventName: string, callback: () => void){
    if (isDefined(callback)) {
      this.events.off(eventName, callback);
    } else {
      this.events.removeAll(eventName);
    }
  }

  async createApp() {
    const { getRoot, params } = await configureStore(this.options);
    const rootElement = getRoot(this.root) as unknown as HTMLElement;
    const appRoot = createRoot(rootElement);

    const store = new Store();
    const internalSDK = new InternalSDK({
      store,
      events: this.events,
    });

    const hydrateStore = () => {
      internalSDK.hydrate({
        config: params.config,
        interfaces: params.interfaces,
        user: params.user,
        task: params.task,
        users: params.users,
      });
    };

    appRoot.render(<App store={store} sdk={internalSDK} afterInit={hydrateStore}/>);

    this[INTERNAL_SDK] = internalSDK;

    const destructor = () => {
      appRoot.unmount();
      // TODO: fix this
      // destroySharedStore();
      destroy(this.store);
    };

    this.destroy = destructor;
  }

  supportLgacyEvents() {
    const keys = Object.keys(legacyEvents) as (keyof typeof legacyEvents)[];

    keys.forEach(key => {
      const callback = this.options[key];

      if (isDefined(callback)) {
        const eventName = toCamelCase(key.replace(/^on/, ''));

        this.events.on(eventName, callback);
      }
    });
  }


  get internalSDK() {
    return this[INTERNAL_SDK];
  }
}
