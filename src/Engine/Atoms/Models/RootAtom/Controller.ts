import { Store } from '@atoms/Store';
import { RootStoreInput } from 'src/Engine/Atoms/Inputs/RootStore';
import { RootAtom } from './RootAtom';

export class RootController extends Store {
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

    this.patch(RootAtom, {
      ...input,
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
