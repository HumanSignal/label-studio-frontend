import { LSOptions } from './Types/LabelStudio/LabelStudio';

const getEnvironment = async () => {
  if (process.env.NODE_ENV === 'development' && !process.env.BUILD_NO_SERVER) {
    return import('./env/development');
  }

  return import('./env/production');
};

export const configureStore = async (params: LSOptions) => {
  if (params.options?.secureMode) window.LS_SECURE_MODE = true;

  const env = await getEnvironment();

  params = { ...params };

  if (!params?.config && env.name === 'development') {
    const { task, config } = await env.getExample();

    params.config = config;
    params.task = task;
  } else if (params?.task) {
    params.task = env.getData(params.task);
  }

  if (params.task?.id) {
    params.taskHistory = [{ taskId: params.task.id, annotationId: null }];
  }

  // const store = AppStore.create(params, {
  //   ...env.configureApplication(params),
  //   events,
  // });

  // store.initializeStore({
  //   ...(params.task ?? {}),
  //   users: params.users ?? [],
  //   annotationHistory: params.history ?? [],
  // });

  return { store: null, params, getRoot: env.rootElement };
};

