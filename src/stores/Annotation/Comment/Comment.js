import { types } from "mobx-state-tree";
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
  });
