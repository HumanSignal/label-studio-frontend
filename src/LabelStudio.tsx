import { createRoot } from 'react-dom/client';
import { configureStore } from './configureStore';
// import { LabelStudio as LabelStudioReact } from './Component';
import { configure } from 'mobx';
import { EventInvoker } from './utils/events';
import legacyEvents from './core/External';
import { toCamelCase } from 'strman';
import { isDefined } from './utils/utilities';
import { Hotkey } from './core/Hotkey';
import defaultOptions from './defaultOptions';
import { destroy } from 'mobx-state-tree';
// import { destroy as destroySharedStore } from './mixins/SharedChoiceStore/mixin';
import { App } from './components/App/AppNew';

configure({
  isolateGlobalState: true,
});

export class LabelStudio {
  // static Component = LabelStudioReact;

  static instances = new Set<LabelStudio>();

  static destroyAll() {
    this.instances.forEach(inst => inst.destroy?.());
    this.instances.clear();
  }

  root: HTMLElement | string;
  events: EventInvoker;
  options: any;
  store: any;
  destroy: (() => void) | null;

  constructor(root: string | HTMLElement, userOptions = {}) {
    const options = Object.assign({}, defaultOptions, userOptions ?? {});

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
    const { store, getRoot } = await configureStore(this.options, this.events);
    const rootElement = getRoot(this.root) as unknown as HTMLElement;
    const appRoot = createRoot(rootElement);

    this.store = store;
    Object.assign(window, { Htx: this.store });

    appRoot.render(<App/>);

    const destructor = () => {
      appRoot.unmount();
      // TODO: fix this
      // destroySharedStore();
      destroy(this.store);
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
