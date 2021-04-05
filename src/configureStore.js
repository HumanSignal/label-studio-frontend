import AppStore from "./stores/AppStore";

const getEnvironment = async () => {
  if (process.env.NODE_ENV === "production") {
    return (await import("./env/production")).default;
  } else {
    return (await import("./env/development")).default;
  }
};

export const configureStore = async (params) => {
  const {options} = params;

  if (options?.secureMode) window.LS_SECURE_MODE = true;

  const env = await getEnvironment();

  params = {...params};

  if (!params.config && env.getExample) {
    const example = await env.getExample();
    Object.assign(params, example);
  } else if (params.task) {
    Object.assign(params, env.getData(params.task));
  }

  const store = AppStore.create(params, env.configureApplication(params));

  store.initializeStore(params);

  return { store, getRoot: env.rootElement };
};

