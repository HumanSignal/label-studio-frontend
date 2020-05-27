import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "mobx-react";

import "./assets/styles/global.scss";
import App from "./components/App/App";
import AppStore from "./stores/AppStore";
import ProductionEnvironment from "./env/production";

if (process.env.NODE_ENV === "production") {
  const environment = ProductionEnvironment;

  window.LabelStudio = (element, options) => {
    let params = options;

    if (params && params.task) {
      params.task = environment.getData(params.task);
    }

    /**
     * Configure Application
     */
    const app = AppStore.create(params, environment.configureApplication(params));

    /**
     * Initialize store
     */
    app.initializeStore(environment.getState(params.task));

    ReactDOM.render(
      <Provider store={app}>
        <App />
      </Provider>,
      environment.rootElement(element),
    );

    window.Htx = app;
    return app;
  };
} else {
  const environment = require("./env/development").default;

  window.LabelStudio = (element, options) => {
    let params = options;

    // this is a way to initialize one of the examples from the src/examples section
    if (!options.config) {
      environment.getExample().then(result => {
        params = {
          ...params,
          ...result,
        };

        let app = AppStore.create(params, environment.configureApplication(params));

        app.initializeStore({ completions: [params.completion], predictions: params.predictions });
        window.Htx = app;

        ReactDOM.render(
          <Provider store={app}>
            <App />
          </Provider>,
          environment.rootElement(element),
        );
      });
    } else {
      // this is static initialization from the index.html file
      params = {
        ...params,
        task: {
          ...params.task,
          data: JSON.stringify(params.task.data),
        },
      };

      let app = AppStore.create(params, environment.configureApplication(params));

      app.initializeStore({ completions: params.task.completions, predictions: params.task.predictions });
      window.Htx = app;

      ReactDOM.render(
        <Provider store={app}>
          <App />
        </Provider>,
        environment.rootElement(element),
      );

      return app;
    }
  };
}
