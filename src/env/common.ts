import { TaskInput } from 'src/Engine/Atoms/Inputs/TaskInput';
import External from '../core/External';
import { LSOptions } from '../Types/LabelStudio/LabelStudio';
import Messages from '../utils/messages';

/**
 * Function to return App element
 */
export function rootElement(element: string | HTMLElement) {
  let root: HTMLElement | null = null;

  if (typeof element === 'string') {
    root = document.getElementById(element);
  } else {
    root = element;
  }

  if (!root) return null;

  root.innerHTML = '';

  root.style.width = 'auto';

  return root;
}

export function getData(task: TaskInput) {
  if (task && task.data) {
    return {
      ...task,
      data: JSON.stringify(task.data),
    };
  }

  return task;
}

/**
 * Function to configure application with callbacks
 * @param {object} params
 */
export function configureApplication(params: LSOptions) {
  const options = {
    settings: params.settings || {},
    messages: { ...Messages, ...params.messages },

    // callbacks and event handlers
    onSubmitAnnotation: params.onSubmitAnnotation ?? External.onSubmitAnnotation,
    onUpdateAnnotation: params.onUpdateAnnotation ?? External.onUpdateAnnotation,
    onDeleteAnnotation: params.onDeleteAnnotation ?? External.onDeleteAnnotation,
    onSkipTask: params.onSkipTask ? params.onSkipTask : External.onSkipTask,
    onUnskipTask: params.onUnskipTask ? params.onUnskipTask : External.onUnskipTask,
    onSubmitDraft: params.onSubmitDraft,
    onTaskLoad: params.onTaskLoad || External.onTaskLoad,
    onLabelStudioLoad: params.onLabelStudioLoad || External.onLabelStudioLoad,
    onEntityCreate: params.onEntityCreate || External.onEntityCreate,
    onEntityDelete: params.onEntityDelete || External.onEntityDelete,
    onGroundTruth: params.onGroundTruth || External.onGroundTruth,
    onSelectAnnotation: params.onSelectAnnotation || External.onSelectAnnotation,
    onAcceptAnnotation: params.onAcceptAnnotation || External.onAcceptAnnotation,
    onRejectAnnotation: params.onRejectAnnotation || External.onRejectAnnotation,
    onStorageInitialized: params.onStorageInitialized || External.onStorageInitialized,
    onNextTask: params.onNextTask || External.onNextTask,
    onPrevTask: params.onPrevTask || External.onPrevTask,

    // other settings aka flags
    forceAutoAnnotation: params.forceAutoAnnotation ?? false,
    forceAutoAcceptSuggestions: params.forceAutoAcceptSuggestions ?? false,
  };

  return options;
}
