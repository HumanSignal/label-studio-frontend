import { User } from '../UsersAtom';

export type Task = {
  id: number,
  queue: string,
  data: string | Record<string, any>,
}

export type TaskHistoryItem = {
  taskId: number,
  annotationId?: string | null,
}

export type Project = {
  id: number,
}

export type RootStore = {
  /**
   * Labeling config in XML fomrat
   */
  config?: string,

  /**
   * Task with data, id and project
   */
  task?: Task,

  /**
   * Project of Label Studio
   * @type {Project}
   * @memberof RootStore
   * @description Project of Label Studio
   */
  project?: Project,

  /**
   * History of task {taskId, annotationId}:
  */
  taskHistory: TaskHistoryItem[],

  /**
   * Configure the visual UI shown to the user
   */
  interfaces: string[],

  /**
   * Flag for labeling of tasks
   */
  explore: boolean,

  /**
   * User of Label Studio
   */
  user: User,

  /**
   * Debug for development environment
   */
  debug: boolean,

  /**
   * Data of description flag
   */
  description?: string,
  // apiCalls: types.optional(types.boolean, true),

  /**
   * Flag for settings
   */
  showingSettings?: boolean,
  /**
   * Flag
   * Description of task in Label Studio
   */
  showingDescription?: boolean,
  /**
   * Loading of Label Studio
   */
  isLoading?: boolean,
  /**
   * Submitting task; used to prevent from duplicating requests
   */
  isSubmitting?: boolean,
  /**
   * Flag for disable task in Label Studio
   */
  noTask?: boolean,
  /**
   * Flag for no access to specific task
   */
  noAccess?: boolean,
  /**
   * Finish of labeling
   */
  labeledSuccess?: boolean,

  /**
   * Show or hide comments section
   */
  showComments: boolean,

  /**
   * Dynamic preannotations
   */
  _autoAnnotation?: boolean,

  /**
   * Auto accept suggested annotations
   */
  _autoAcceptSuggestions?: boolean,

  /**
   * Indicator for suggestions awaiting
   */
  awaitingSuggestions?: boolean,

  users: User[],

  userLabels: any,
}
