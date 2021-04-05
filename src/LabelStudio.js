import { inject, observer } from "mobx-react";
import { render } from "react-dom";
import App from "./components/App/App";
import AppStore from "./stores/AppStore";

export class LabelStudio {
  constructor (root, options = {}) {
    this.root = root;
    this.options = options ?? {};
    this.panels = this.registerPanels(this.options.panels);
    this.createApp();
  }

  async createApp() {
    const {options} = this.options;

    if (options?.secureMode) window.LS_SECURE_MODE = true;

    const env = await this.getEnvironment();

    const params = {...this.options};

    if (!this.options.config) {
      const example = await env.getExample();
      Object.assign(params, example);
    } else if (this.options.task) {
      Object.assign(params, env.getData(this.options.task));
    }

    this.store = AppStore.create(params, env.configureApplication(params));
    this.store.initializeStore(params);

    window.Htx = this.store;

    render((
      <App
        store={this.store}
        panels={this.options.panels ?? []}
      />
    ), env.rootElement(this.root));
  }

  /**@private */
  async getEnvironment() {
    if (process.env.NODE_ENV === "production") {
      return (await import("./env/production")).default;
    } else {
      return (await import("./env/development")).default;
    }
  }

  /**@private */
  registerPanels(panels = []) {
    return panels.map(panel => ({
      ...panel,
      Component: panel.builder({ inject, observer })
    }));
  }
}
