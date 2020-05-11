import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "mobx-react";

import "./assets/styles/global.scss";
import * as serviceWorker from "./serviceWorker";
import App from "./components/App/App";
import AppStore from "./stores/AppStore";
import ProductionEnvironment from "./env/production";

let environment = ProductionEnvironment;

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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
