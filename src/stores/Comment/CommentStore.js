import { flow, getEnv, getParent, getRoot, getSnapshot, types } from "mobx-state-tree";
import uniqBy from "lodash/uniqBy";
import Utils from "../../utils";
import { Comment } from "./Comment";
import { FF_DEV_3034, isFF } from "../../utils/feature-flags";
import { delay } from "../../utils/utilities";

const requests = {};

export const CommentStore = types
  .model("CommentStore", {
    loading: types.optional(types.maybeNull(types.string), null),
    comments: types.optional(types.array(Comment), []),
  })
  .views(self => ({
    get store() {
      return getParent(self);
    },
    get task() {
      return getParent(self).task;
    },
    get annotation() {
      return getParent(self).annotationStore.selected;
    },
    get annotationId() {
      return isNaN(self.annotation?.pk) ? undefined : self.annotation.pk;
    },
    get draftId() {
      if (!self.annotation?.draftId) return null;
      return self.annotation.draftId;
    },
    get currentUser() {
      return getRoot(self).user;
    },
    get sdk() {
      return getEnv(self).events;
    },
    get isListLoading() {
      return self.loading === "list";
    },
    get taskId() {
      return self.task?.id;
    },
    get canPersist() {
      if (isFF(FF_DEV_3034)) {
        return self.taskId !== null && self.taskId !== undefined;
      }
      return self.annotationId !== null && self.annotationId !== undefined;
    },
    get isCommentable() {
      return !self.annotation || ["annotation"].includes(self.annotation.type);
    },
    get queuedComments() {
      const queued = self.comments.filter(comment => !comment.isPersisted);

      return queued.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    get hasUnsaved() {
      return self.queuedComments.length > 0;
    },
    get refKey() {
      const parentId = self.annotationId || self.draftId;

      return parentId ? `t:${self.taskId}-${self.annotationId ? 'a:' : self.draftId ? 'd:' : ''}${parentId}` : '';
    },
    get shouldFetch() {
      return !self.isListLoading && !!self.refKey && Date.now() - (requests?.[self.refKey]?.at || 0) >= 0;
    },
  }))
  .actions(self => {
    function serialize({ commentsFilter, queueComments } = { commentsFilter: 'all', queueComments: false }) { 

      const serializedComments = getSnapshot(commentsFilter === 'queued' ? self.queuedComments : self.comments);
      
      return {
        comments: queueComments ? serializedComments.map(comment => ({ id: comment.id > 0 ? comment.id * -1 : comment.id, ...comment })): serializedComments,
      };
    }

    function setLoading(loading = null) {
      self.loading = loading;
    }

    function replaceId(id, newComment) {
      const comments = self.comments;

      const index = comments.findIndex(comment => comment.id === id);

      if (index > -1) {
        const snapshot = getSnapshot(comments[index]);

        comments[index] = { ...snapshot, id : newComment.id || snapshot.id };
      }
    }

    function removeCommentById(id)  {
      const comments = self.comments;

      const index = comments.findIndex(comment => comment.id === id);

      if (index > -1) {
        comments.splice(index, 1);
      }
    }

    async function persistQueuedComments() {
      const toPersist = self.queuedComments;

      if (!self.canPersist || !toPersist.length) return;

      if (isFF(FF_DEV_3034) && !self.annotationId && !self.draftId) {
        await self.store.submitDraft(self.annotation);
      }

      try {
        self.setLoading("persistQueuedComments");
        for (const comment of toPersist) {
          if (self.annotationId) {
            comment.annotation = self.annotationId;
          } else if (self.draftId) {
            comment.draft = self.draftId;
          } else {
            comment.task = self.taskId;
          }
          const [persistedComment] = await self.sdk.invoke("comments:create", comment);

          if (persistedComment) {
            self.replaceId(comment.id, persistedComment);
          }
        }
      } catch(err) {
        console.error(err);
      } finally {
        self.setLoading(null);
      }
    }

    const addComment = flow(function* (text) {
      const now = Date.now() * -1;

      const comment =  {
        id: now,
        text,
        task: self.taskId,
        created_by: self.currentUser.id,
        created_at: Utils.UDate.currentISODate(),
      };

      let refetchList = false;
      const { annotation } = self;

      if (isFF(FF_DEV_3034) && !self.annotationId && !self.draftId) {
        // rare case: draft is already saving, so just wait for it
        if (annotation.versions.draft) {
          yield delay(annotation.autosaveDelay);
        } else {
          // replicate actions from autosave()
          // versions.draft should not be empty
          annotation.versions.draft = [];
          annotation.setDraftSelected();
          annotation.setDraftSaving(true);
          yield self.store.submitDraft(self.annotation);
          annotation.onDraftSaved();
        }
        refetchList = true;
      }

      if (self.annotationId) {
        comment.annotation = self.annotationId;
      } else if (self.draftId) {
        comment.draft = self.draftId;
      }

      // @todo setComments?
      self.comments.unshift(comment);

      if (self.canPersist) {
        try {
          self.setLoading("addComment");

          const [newComment] = yield self.sdk.invoke("comments:create", comment);

          if (newComment) {
            self.replaceId(now, newComment);
            if (refetchList) self.listComments();
          }
        } catch(err) {
          self.removeCommentById(now);
          throw err;
        } finally{ 
          self.setLoading(null);
        }
      }
    });

    function setComments(comments) {
      if (comments) {
        self.comments.replace(comments);
      }
    }

    function hasCache(key) {
      localStorage.getItem(`commentStore.${key}`) !== null;
    }

    function removeCache(key) {
      localStorage.removeItem(`commentStore.${key}`);
    }

    function toCache(key, options = { commentsFilter: 'all', queueComments: true }) {
      localStorage.setItem(`commentStore.${key}`, JSON.stringify(self.serialize(options)));
    }

    function fromCache(key, { merge = true, queueRestored = false } = { }) {
      const value = localStorage.getItem(`commentStore.${key}`);

      if (value) {
        const restored = JSON.parse(value);

        if (Array.isArray(restored?.comments)) {
          let restoreIds = [];

          if (queueRestored) { 
            restoreIds = restored.comments.map(comment => comment.id);
          }
          if (merge) {
            restored.comments = uniqBy([
              ...restored.comments,
              ...getSnapshot(self.comments),
            ], 'id')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
          if (restoreIds.length) {
            restored.comments = restored.comments.map((comment) =>
              restoreIds.includes(comment.id) ? ({
                id: comment.id > 0 ? comment.id * -1 : comment.id,
                ...comment,
              }): comment);
          }
          self.setComments(restored.comments);
        }
      }
    }

    async function restoreCommentsFromCache(key) {
      self.fromCache(key, { merge: true, queueRestored: true });
    }

    const listComments = flow((function* ({ mounted = { current: true } } = {}) {
      const shouldFetch = self.shouldFetch;
      const refKey = self.refKey;

      if (shouldFetch) {
        // stale-while-revalidate to dedupe requests for the same comments
        self.setComments(requests?.[refKey]?.comments || []);
      }

      if ((!self.draftId && !self.annotationId) || !shouldFetch) return;

      try {
        if (mounted.current) {
          self.setLoading("list");
          // clear the comments cache and leave the request 30 seconds to become stale, so we don't get a stuck cache
          // forever if there are api errors or actual issues.
          requests[refKey] = { at: Date.now() + 30000, comments: [] };
        }

        const annotation = self.annotationId;
        const [comments] = yield self.sdk.invoke("comments:list", {
          annotation,
          draft: self.draftId,
        });

        // Fresh for 1 second after the request completes to avoid refetching the same data again
        requests[refKey] = { at: Date.now() + 1000, comments };

        if (mounted.current && annotation === self.annotationId) {
          self.setComments(comments);
        }
      } catch(err) {
        // clear the comments cache if there was an error
        requests[refKey] = { at: 0, comments: [] };
        console.error(err);
      } finally {
        if (mounted.current) {
          self.setLoading(null);
        }
      }
    }));


    return {
      serialize,
      hasCache,
      removeCache,
      toCache,
      fromCache,
      restoreCommentsFromCache,
      setLoading,
      replaceId,
      removeCommentById,
      persistQueuedComments,
      addComment,
      setComments,
      listComments,
    };
  });
