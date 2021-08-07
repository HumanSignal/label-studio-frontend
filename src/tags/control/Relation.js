import { types } from "mobx-state-tree";

import Registry from "../../core/Registry";
import Constants from "../../core/Constants";
import { guidGenerator } from "../../core/Helpers";
import { customTypes } from "../../core/CustomTypes";

/**
 * Relation tag represents a single relation label
 * @example
 * <View>
 *   <Relations>
 *     <Relation value="hello" />
 *     <Relation value="world" />
 *   </Relations>
 *
 *   <Text name="txt-1" value="$text" />
 *   <Labels name="lbl-1" toName="txt-1">
 *     <Label value="Relevant" />
 *     <Label value="Not Relevant" />
 *   </Labels>
 * </View>
 * @name Relation
 * @param {string} value        - Value of the relation
 * @param {string} [background] - Background color of the active label
 */
const TagAttrs = types.model({
  value: types.maybeNull(types.string),
  background: types.optional(customTypes.color, Constants.RELATION_BACKGROUND),
});

const Model = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    selected: types.optional(types.boolean, false),
    type: "relation",
  })
  .actions(self => ({
    setSelected (value) {
      self.selected = value;
    },
  }));

const RelationModel = types.compose("RelationModel", TagAttrs, Model);

const HtxRelationView = () => {
  return null;
};

Registry.addTag("relation", RelationModel, HtxRelationView);

export { HtxRelationView, RelationModel };
