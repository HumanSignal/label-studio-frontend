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
    get queuedComments() {
      return self.comments.filter(comment => !comment.isPersisted).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    },
  }))
  .actions(self => {
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
        await Promise.all(toPersist.map(async (comment) => {
          comment.annotation = self.parentId;
          const [persistedComment] = await self.sdk.invoke("comments:create", comment);

          if (persistedComment) {
            self.replaceId(comment.id, persistedComment);
          }
        }));
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
      setLoading,
      replaceId,
      removeCommentById,
      persistQueuedComments,
      addComment,
      setComments,
      listComments,
    };
  });
