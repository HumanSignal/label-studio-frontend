import { types } from "mobx-state-tree";

import Registry from "../../core/Registry";
import Types from "../../core/Types";
import { guidGenerator } from "../../core/Helpers";
import ControlBase from "./Base";

/**
 * Relations tag, create relations labels
 * @example
 * <View>
 *   <Relations>
 *     <Relation value="hello" />
 *     <Relation value="world" />
 *   </Relations>
 *   <Text name="txt-1" value="$text" />
 *   <Labels name="lbl-1" toName="txt-1">
 *     <Label value="Relevant" />
 *     <Label value="Not Relevant" />
 *   </Labels>
 * </View>
 * @name Relations
 * @param {single|multiple=} [choice=single] configure if you can select just one or multiple labels
 */
const TagAttrs = types.model({
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

    selectedValues() {
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

const RelationsModel = types.compose("RelationsModel", ModelAttrs, TagAttrs, ControlBase);

const HtxRelations = () => {
  return null;
};

Registry.addTag("relations", RelationsModel, HtxRelations);

export { HtxRelations, RelationsModel };
