import AppStore from "./stores/AppStore";

const getEnvironment = async () => {
  if (process.env.NODE_ENV === "production") {
    return (await import("./env/production")).default;
  } else {
    return (await import("./env/development")).default;
  }
};

export const configureStore = async (params) => {
  if (params.options?.secureMode) window.LS_SECURE_MODE = true;

  const env = await getEnvironment();

  params = {...params};

  if (!params?.config && env.getExample) {
    const {task, config} = await env.getExample();
    params.config = config;
    params.task = task;
  } else if (params?.task) {
    params.task = env.getData(params.task);
  }

  const store = AppStore.create(params, env.configureApplication(params));

  store.initializeStore({
    ...(params.task ?? {}),
    annotationHistory: params.history ?? []
  });

  return { store, getRoot: env.rootElement };
};

