import { types } from "mobx-state-tree";
import { guidGenerator } from "../../utils/unique";
import { Annotation } from "./Annotation";

const HistoryTypes = types.enumeration([
  'created',
  'updated',
  'draft-created',
  'review-fixed',
  'review-accepted',
  'review-rejected',
]);

export const HistoryItem = types.compose("HistoryItem", Annotation, types.model({
  /**
   * Optional comment
   */
  comment: types.optional(types.maybeNull(types.string), null),

  /**
   * Action associated with the history item
   */
  actionType: types.optional(types.maybeNull(HistoryTypes), null),
})).preProcessSnapshot(snapshot => {
  let actionType = snapshot.actionType ?? snapshot.action_type ?? snapshot.acceptedState;

  switch(actionType) {
    case 'fixed': actionType = 'review-fixed'; break;
    case 'accepted': actionType = 'review-accepted'; break;
    case 'rejected': actionType = 'review-rejected'; break;
    default: break;
  }

  return {
    ...snapshot,
    pk: guidGenerator(),
    actionType,
    user: snapshot.created_by,
    createdDate: snapshot.created_at,
    editable: false,
  };
});
