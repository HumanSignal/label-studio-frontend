import React from "react";
import { types } from "mobx-state-tree";

import Registry from "../../core/Registry";
import Types from "../../core/Types";
import { guidGenerator } from "../../core/Helpers";

/**
 * Relations tag, create relations labels
 * @example
 * <View>
 *   <Relations name="type" toName="txt-1">
 *     <Relation alias="B" value="" />
 *     <Relation alias="P" value="" />
 *   </Relations>
 * </View>
 * @name Relations
 * @param {single|multiple=} [choice=single] configure if you can select just one or multiple relations
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  toname: types.maybeNull(types.string),
  choice: types.optional(types.enumeration(["single", "multiple"]), "multiple"),
});

/**
 * @param {boolean} showinline
 * @param {identifier} id
 * @param {string} pid
 */
const ModelAttrs = types
  .model({
    id: types.optional(types.identifier, guidGenerator),
    pid: types.optional(types.string, guidGenerator),
    type: "relations",
    children: Types.unionArray(["relations", "relation"]),
  })
  .views(self => ({
    getSelected() {
      return self.children.filter(c => c.selected === true);
    },

    getSelectedNames() {
      return self.getSelected().map(c => c.value);
    },

    findRelation(value) {
      return self.children.find(c => c.value === value);
    },
  }))
  .actions(self => ({
    unselectAll() {
      self.children.map(c => c.setSelected(false));
    },
  }));

const RelationsModel = types.compose("RelationsModel", ModelAttrs, TagAttrs);

const HtxRelations = () => {
  return null;
};

Registry.addTag("relations", RelationsModel, HtxRelations);

export { HtxRelations, RelationsModel };
