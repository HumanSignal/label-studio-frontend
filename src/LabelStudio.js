import { render, unmountComponentAtNode } from "react-dom";
import App from "./components/App/App";
import { configureStore } from "./configureStore";
import { LabelStudio as LabelStudioReact } from './Component';
import { registerPanels } from "./registerPanels";
import { configure } from "mobx";
import {EventInvoker} from './utils/events';
import legacyEvents from './core/External';
import { toCamelCase } from "strman";
import { isDefined } from "./utils/utilities";

configure({
  isolateGlobalState: true,
});

export class LabelStudio {
  static instances = new Set();

  static destroyAll() {
    this.instances.forEach(inst => inst.destroy());
    this.instances.clear();
  }

  constructor (root, options = {}) {
    this.root = root;
    this.events = new EventInvoker();
    this.supportLgacyEvents(options);
    this.options = options ?? {};
    this.destroy = (() => { /* noop */ });
    this.createApp();

    this.constructor.instances.add(this);
  }

  on(...args) {
    this.events.on(...args);
  }

  off(eventName, callback){
    if (isDefined(callback)) {
      this.events.off(eventName, callback);
    } else {
      this.events.removeAll(eventName);
    }
  }

  async createApp() {
    const {store, getRoot} = await configureStore(this.options, this.events);
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
      unmountComponentAtNode(rootElement);
    };

    this.destroy = destructor;
  }

  supportLgacyEvents(options) {
    const keys = Object.keys(legacyEvents);

    keys.forEach(key => {
      const callback = options[key];

      if (isDefined(callback)) {
        const eventName = toCamelCase(key.replace(/^on/, ''));
        this.events.on(eventName, callback);
      }
    });
  }
}

LabelStudio.Component = LabelStudioReact;
