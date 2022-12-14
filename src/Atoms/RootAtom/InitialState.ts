import { RootStore } from './Types';

export const InitialState: RootStore = {
  config: '',
  taskHistory: [],
  interfaces: [],
  explore: false,
  user: {
    id: '',
  },
  debug: window.HTX_DEBUG === true,
  users: [],
  userLabels: [],
  showComments: false,
};
