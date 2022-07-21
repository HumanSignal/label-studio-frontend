import { getEnv, getParent, types } from "mobx-state-tree";
import Utils from "../../../utils";
import { guidGenerator } from "../../../utils/unique";
import { Comment } from "./Comment";

export const CommentStore = types
  .model("CommentStore", {
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
  }))
  .actions(self => {
    async function addComment(content) {
      const comment =  {
        id: guidGenerator(5),
        content,
        annotation: self.parent.pk,
        created_by: self.currentUser.id,
        created_at: Utils.UDate.currentISODate(),
      };

      self.comments.unshift(comment);

      try {
        await self.sdk.invoke("comments:add", comment);
      } catch(err) {
        self.comments.shift();
        throw err;
      }
    }

    async function fetchComments() {
      try {
        const comments = await self.sdk.invoke("comments:list", {
          annotation: self.parent.pk,
        });

        self.comments.replace(comments);
      } catch(err) {
        console.log(err);
      }
    }

    return {
      addComment,
      fetchComments,
    };
  });
