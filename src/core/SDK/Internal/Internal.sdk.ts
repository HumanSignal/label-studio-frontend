import { User } from '@atoms/UsersAtom';
import { RootAtom } from '../../../Atoms/RootAtom/RootAtom';
import { TaskInput } from '../../Data/Inputs/TaskInput';
import { Store } from '../../Data/Store';
import { AnnotationsSDK } from '../Shared/Annotations.sdk';
import { StoreAccess } from '../Shared/StoreAccess.sdk';

type Hydrate = {
  interfaces?: string[],
  description?: string,
  user?: User,
  users?: User[],
  task?: TaskInput,
  taskHistory?: any,
  config?: string,
}

class InternalSDK extends StoreAccess {
  annotations: AnnotationsSDK;

  constructor(store: Store) {
    super(store);
    this.annotations = new AnnotationsSDK(store);
  }

  hydrate(data: Hydrate) {
    console.log('Hydrate');

    this.hydrateRoot(data);
    this.hydrateAnnotations(data.task);
  }

  private hydrateRoot(data: Hydrate) {
    const { interfaces, description, taskHistory, task, user, users } = data;

    const taskData = task && ((task.data && !(typeof task.data === 'string'))
      ? JSON.stringify(task.data)
      : task.data) || '';

    this.store.patch(RootAtom, {
      task: {
        id: task?.id ?? 0,
        queue: task?.queue ?? '',
        data: taskData,
      },
      config: data.config ?? '',
      interfaces: interfaces ?? [],
      description: description ?? '',
      taskHistory: taskHistory ?? [],
      user,
      users: users ?? [],
    });
  }

  private hydrateAnnotations(task?: TaskInput) {
    if (!task) return;

    const { annotations, predictions } = task;

    this.annotations.hydrate({
      annotations: annotations ?? [],
      predictions: predictions ?? [],
    });
  }
}

export { InternalSDK };
