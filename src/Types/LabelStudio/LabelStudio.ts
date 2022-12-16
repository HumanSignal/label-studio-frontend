import { RootStoreInput } from '@atoms/Inputs/RootStore';
import legacyEvents from '../../core/External';
import { SystemMessage } from '../../utils/messages';

export type LSOptions = RootStoreInput & {
  keymap?: Record<string, any>,
  forceAutoAnnotation?: boolean,
  forceAutoAcceptSuggestions?: boolean,
  messages?: Record<string, SystemMessage>,
  settings?: Record<string, any>,
  options?: {
    secureMode?: boolean,
  },
} & Partial<typeof legacyEvents>
