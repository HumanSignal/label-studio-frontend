import { inject, observer } from "mobx-react";
import { render } from "react-dom";
import App from "./components/App/App";
import { configureStore } from "./configureStore";
import { LabelStudio as LabelStudioReact } from './Component';

export class LabelStudio {
  constructor (root, options = {}) {
    this.root = root;
    this.options = options ?? {};
    this.panels = this.registerPanels(this.options.panels);
    this.createApp();
  }

  async createApp() {
    const {store, getRoot} = await configureStore(this.options);
    this.store = store;
    window.Htx = this.store;

    render((
      <App
        store={this.store}
        panels={this.options.panels ?? []}
      />
    ), getRoot(this.root));
  }

  /**@private */
  registerPanels(panels = []) {
    return panels.map(panel => ({
      ...panel,
      Component: panel.builder({ inject, observer })
    }));
  }
}

LabelStudio.Component = LabelStudioReact;
