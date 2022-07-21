import { getEnv, getParent, getSnapshot, types } from "mobx-state-tree";
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
      return self.parent.user;
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

    function removeCommentId(id)  {
      const comments = self.comments;

      const index = comments.findIndex(comment => comment.id === id);

      if (index > -1) {
        comments.splice(index, 1);
      }
    }

    async function addComment(text) {
      const now = Date.now();

      const comment =  {
        id: now,
        text,
        annotation: self.parent.pk,
        created_by: self.currentUser.id,
        created_at: Utils.UDate.currentISODate(),
      };

      self.comments.unshift(comment);

      try {
        self.setLoading("addComment");
        const [newComment] = await self.sdk.invoke("comments:create", comment);

        if (newComment) {
          self.replaceId(now, newComment);
        }
      } catch(err) {
        self.removeCommentId(now);
        throw err;
      } finally{ 
        self.setLoading(null);
      }
    }

    function setComments(comments) {
      if (comments) {
        self.comments.replace(comments);
      }
    }

    async function listComments() {
      if (!self.parentId) return;

      try {
        self.setLoading("list");

        const [comments] = await self.sdk.invoke("comments:list", {
          annotation: self.parentId,
        });

        self.setComments(comments);
      } catch(err) {
        console.log(err);
      } finally {
        self.setLoading(null);
      }
    }

    return {
      setLoading,
      replaceId,
      removeCommentId,
      addComment,
      setComments,
      listComments,
    };
  });
