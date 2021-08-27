import AppStore from "./stores/AppStore";

const getEnvironment = async () => {
  if (process.env.NODE_ENV === "development" && !process.env.BUILD_NO_SERVER) {
    return (await import("./env/development")).default;
  }

  return (await import("./env/production")).default;
};

export const configureStore = async (params, events) => {
  if (params.options?.secureMode) window.LS_SECURE_MODE = true;

  const env = await getEnvironment();

  params = { ...params };

  if (!params?.config && env.getExample) {
    const { task, config } = await env.getExample();

    params.config = config;
    params.task = task;
  } else if (params?.task) {
    params.task = env.getData(params.task);
  }

  const store = AppStore.create(params, {
    ...env.configureApplication(params),
    events,
  });

  store.initializeStore({
    ...(params.task ?? {}),
    users: params.users ?? [],
    annotationHistory: params.history ?? [],
  });

  return { store, getRoot: env.rootElement };
};

