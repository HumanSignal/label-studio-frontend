import { getParent, types } from "mobx-state-tree";
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
  }))
  .actions(self => {
    function addComment(content) {
      self.comments.unshift({
        id: guidGenerator(5),
        content,
        createdBy: self.currentUser.id,
        createdAt: Utils.UDate.currentISODate(),
        updatedAt: Utils.UDate.currentISODate(),
        is_resolved: false,
      });
    }

    return {
      addComment,
    };
  });
