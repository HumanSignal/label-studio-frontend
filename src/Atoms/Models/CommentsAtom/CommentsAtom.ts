import { atom } from 'jotai';
import { CommentsStore } from './Types';

export const commentsAtom = atom<CommentsStore>({
  comments: [],
});
