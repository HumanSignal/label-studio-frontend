import { User } from 'src/Engine/Atoms/UsersAtom';
import { TaskInput } from './TaskInput';

export type RootStoreInput = {
  interfaces?: string[],
  description?: string,
  user?: User,
  users?: User[],
  task?: TaskInput,
  taskHistory?: any,
  config?: string,
  forceAutoAnnotation?: boolean,
  forceAutoAcceptSuggestions?: boolean,
}
