import { inject, observer } from "mobx-react";
import { render } from "react-dom";
import App from "./components/App/App";
import { configureStore } from "./configureStore";
import { LabelStudio as LabelStudioReact } from './Component';
import { registerPanels } from "./registerPanels";

export class LabelStudio {
  constructor (root, options = {}) {
    this.root = root;
    this.options = options ?? {};
    this.createApp();
  }

  async createApp() {
    const {store, getRoot} = await configureStore(this.options);
    this.store = store;
    window.Htx = this.store;

    render((
      <App
        store={this.store}
        panels={registerPanels(this.options.panels) ?? []}
      />
    ), getRoot(this.root));
  }
}

LabelStudio.Component = LabelStudioReact;
