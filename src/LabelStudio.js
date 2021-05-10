import { render, unmountComponentAtNode } from "react-dom";
import App from "./components/App/App";
import { configureStore } from "./configureStore";
import { LabelStudio as LabelStudioReact } from './Component';
import { registerPanels } from "./registerPanels";
import { configure } from "mobx";

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
    this.options = options ?? {};
    this.destroy = (() => { /* noop */ });
    this.createApp();

    this.constructor.instances.add(this);
  }

  async createApp() {
    const {store, getRoot} = await configureStore(this.options);
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
}

LabelStudio.Component = LabelStudioReact;
