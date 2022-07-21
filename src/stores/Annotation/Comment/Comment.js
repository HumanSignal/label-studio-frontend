import { getEnv, types } from "mobx-state-tree";
import Utils from "../../../utils";
import { camelizeKeys } from "../../../utils/utilities";
import { UserExtended } from "../../UserStore";

export const Comment = types.model("Comment", {
  id: types.identifier,
  content: types.string,
  createdAt: types.optional(types.string, Utils.UDate.currentISODate()),
  updatedAt: types.optional(types.string, Utils.UDate.currentISODate()),
  resolvedAt: types.optional(types.maybeNull(types.string), null),
  createdBy: types.optional(types.maybeNull(types.safeReference(UserExtended)), null),
  isResolved: false,
})
  .preProcessSnapshot((sn) => {
    return camelizeKeys(sn ?? {});
  })
  .views(self => ({
    get sdk() {
      return getEnv(self).events;
    },
  }))
  .actions(self => {
    async function toggleResolve() {

      self.isResolved = !self.isResolved;

      const apiAction = self.isResolved ? "comments:resolve" : "comments:unresolve";

      try {
        await self.sdk.invoke(apiAction, {
          id: self.id,
        });
      } catch(err) {
        self.isResolved = !self.isResolved;
        throw err;
      }
    }

    return {
      toggleResolve,
    };
  });
