import { RootStoreInput } from '@atoms/Inputs/RootStore';
import { StoreAccess } from '@atoms/StoreAccess';
import { RootAtom } from './RootAtom';

export class RootModel extends StoreAccess {
  hydrate(input: RootStoreInput): void {
    const { interfaces, description, taskHistory, task: taskRaw, user, users } = input;

    const taskData = taskRaw && ((taskRaw.data && !(typeof taskRaw.data === 'string'))
      ? JSON.stringify(taskRaw.data)
      : taskRaw.data) || '';

    const task = {
      id: taskRaw?.id ?? 0,
      queue: taskRaw?.queue ?? '',
      data: taskData,
    };

    this.store.patch(RootAtom, {
      task,
      config: input.config ?? '',
      interfaces: interfaces ?? [],
      description: description ?? '',
      taskHistory: taskHistory ?? [],
      user,
      users: users ?? [],
    });
  }
}
