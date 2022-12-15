import { TaskHistoryItem } from '../../Atoms/RootAtom/Types';
import { User } from '../../Atoms/UsersAtom';
import { TaskInput } from '../../core/Data/Inputs/TaskInput';
import legacyEvents from '../../core/External';
import { SystemMessage } from '../../utils/messages';

export type LSOptions = {
  config?: string,
  interfaces?: string[],
  user?: User,
  users?: User[],
  task?: TaskInput,
  keymap?: Record<string, any>,
  forceAutoAnnotation?: boolean,
  forceAutoAcceptSuggestions?: boolean,
  messages?: Record<string, SystemMessage>,
  settings?: Record<string, any>,
  taskHistory?: TaskHistoryItem[],
  options?: {
    secureMode?: boolean,
  },
} & Partial<typeof legacyEvents>
