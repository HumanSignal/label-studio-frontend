import React, { render, unmountComponentAtNode } from "react-dom";
import App from "./components/App/App";
import { configureStore } from "./configureStore";
import { LabelStudio as LabelStudioReact } from './Component';
import { registerPanels } from "./registerPanels";

export class LabelStudio {
  constructor (root, options = {}) {
    this.root = root;
    this.options = options ?? {};
    this.destroy = (() => { /* noop */ });
    this.createApp();
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

    this.destroy = () => {
      unmountComponentAtNode(rootElement);
    };
  }
}

LabelStudio.Component = LabelStudioReact;
