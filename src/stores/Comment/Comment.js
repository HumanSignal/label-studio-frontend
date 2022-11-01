import { getEnv, types } from "mobx-state-tree";
import Utils from "../../utils";
import { camelizeKeys } from "../../utils/utilities";
import { UserExtended } from "../UserStore";

export const Comment = types.model("Comment", {
  id: types.identifierNumber,
  text: types.string,
  createdAt: types.optional(types.string, Utils.UDate.currentISODate()),
  resolvedAt: types.optional(types.maybeNull(types.string), null),
  createdBy: types.optional(types.maybeNull(types.safeReference(UserExtended)), null),
  isResolved: false,
  isEditMode: types.optional(types.boolean, false),
  isDeleted: types.optional(types.boolean, false),
  isConfirmDelete: types.optional(types.boolean, false),
})
  .preProcessSnapshot((sn) => {
    return camelizeKeys(sn ?? {});
  })
  .views(self => ({
    get sdk() {
      return getEnv(self).events;
    },
    get isPersisted() {
      return self.id > 0;
    },
  }))
  .actions(self => {
    async function toggleResolve() {
      if (!self.isPersisted) return;

      self.isResolved = !self.isResolved;

      try {
        await self.sdk.invoke("comments:update", {
          id: self.id,
          is_resolved: self.isResolved,
        });
      } catch(err) {
        self.isResolved = !self.isResolved;
        throw err;
      }
    }

    function setEditMode( newMode ) {
      self.isEditMode = newMode;
    }

    function setDeleted( newMode ) {
      self.isDeleted = newMode;
    }

    function setConfirmMode( newMode ) {
      self.isConfirmDelete = newMode;
    }

    async function updateComment( comment ) {
      await self.sdk.invoke("comments:update", {
        id: self.id,
        text: comment,
      });
      self.setEditMode(false);
    }

    async function deleteComment() {
      await self.sdk.invoke("comments:delete", {
        id: self.id,
      });
      self.setDeleted(true);
      self.setConfirmMode(false);
    }

    return {
      toggleResolve,
      setEditMode,
      setDeleted,
      setConfirmMode,
      updateComment,
      deleteComment,
    };
  });
