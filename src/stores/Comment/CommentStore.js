import { getEnv, getParent, getRoot, getSnapshot, types } from "mobx-state-tree";
import Utils from "../../utils";
import { Comment } from "./Comment";

export const CommentStore = types
  .model("CommentStore", {
    loading: types.optional(types.maybeNull(types.string), "list"),
    comments: types.optional(types.array(Comment), []),
  })
  .views(self => ({
    get parent() {
      return getParent(self);
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
    get parentId() {
      return self.parent.pk;
    },
    get canPersist() {
      return self.parentId !== null && self.parentId !== undefined;
    },
    get isCommentable() {
      return ["annotation"].includes(self.parent.type);
    },
    get queuedComments() {
      const queued = self.comments.filter(comment => !comment.isPersisted);

      return queued.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    get hasUnsaved() {
      return self.queuedComments.length > 0;
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

      try {
        self.setLoading("persistQueuedComments");
        for (const comment of toPersist) {
          comment.annotation = self.parentId;
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

    async function addComment(text) {
      const now = Date.now() * -1;

      const comment =  {
        id: now,
        text,
        annotation: self.parentId,
        created_by: self.currentUser.id,
        created_at: Utils.UDate.currentISODate(),
      };

      self.comments.unshift(comment);

      if (self.canPersist) {
        try {
          self.setLoading("addComment");

          const [newComment] = await self.sdk.invoke("comments:create", comment);

          if (newComment) {
            self.replaceId(now, newComment);
          }
        } catch(err) {
          self.removeCommentById(now);
          throw err;
        } finally{ 
          self.setLoading(null);
        }
      }
    }

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
          if (queueRestored) {
            restored.comments = restored.comments.map(comment => ({ id: comment.id > 0 ? comment.id * -1 : comment.id,  ...comment }));
          }
          if (merge) {
            restored.comments = [...restored.comments, ...getSnapshot(self.comments)].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
          self.setComments(restored.comments);
        }
      }
    }

    async function restoreCommentsFromCache(key) {
      self.fromCache(key, { merge: true, queueRestored: true });
    }

    async function listComments({ mounted = null } = {}) {
      if (!self.parentId) return;

      try {
        if (mounted === null || mounted.current) {
          self.setLoading("list");
        }

        const [comments] = await self.sdk.invoke("comments:list", {
          annotation: self.parentId,
        });

        if (mounted === null || mounted.current) {
          self.setComments(comments);
        }
      } catch(err) {
        console.error(err);
      } finally {
        if (mounted === null || mounted.current) {
          self.setLoading(null);
        }
      }
    }

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
