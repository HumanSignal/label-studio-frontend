import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";
import DropdownTreeSelect from "react-dropdown-tree-select";

import Infomodal from "../../components/Infomodal/Infomodal";
import { Taxonomy } from "../../components/Taxonomy/Taxonomy";
import { guidGenerator } from "../../core/Helpers";
import Registry from "../../core/Registry";
import Types from "../../core/Types";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import RequiredMixin from "../../mixins/Required";
import VisibilityMixin from "../../mixins/Visibility";
import { isArraysEqual } from "../../utils/utilities";
import ControlBase from "./Base";

import "react-dropdown-tree-select/dist/styles.css";

/**
 * Taxonomy tag allows to select one or more hierarchical labels
 * storing both label and their ancestors.
 * @example
 * <View>
 *   <Taxonomy name="media" toName="text">
 *     <Choice value="Online">
 *       <Choice value="UGC" />
 *       <Choice value="Free" />
 *       <Choice value="Paywall">
 *         <Choice value="NYC Times" />
 *         <Choice value="The Wall Street Journal" />
 *       </Choice>
 *     </Choice>
 *     <Choice value="Offline" />
 *   </Taxonomy>
 *   <Text name="text" value="You'd never believe what he did to the country" />
 * </View>
 * @name Taxonomy
 * @meta_title Taxonomy Tags for Hierarchical Labels
 * @meta_description Label Studio Taxonomy Tags customize Label Studio by using hierarchical labels for machine learning and data science projects.
 * @param {string} name                - Name of the element
 * @param {string} toName              - Name of the element that you want to classify
 * @param {boolean} [leafsOnly=false]  - Allow to select only leaf nodes of taxonomy
 * @param {boolean} [showFullPath=false] - Show full path of selected items
 * @param {string} [pathSeparator= / ] - Separator to show in the full path
 * @param {number} [maxUsages]         - Maximum available usages
 * @param {boolean} [required=false]   - Whether taxonomy validation is required
 * @param {string} [requiredMessage]   - Message to show if validation fails
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
  leafsonly: types.optional(types.boolean, false),
  showfullpath: types.optional(types.boolean, false),
  pathseparator: types.optional(types.string, " / "),
  maxusages: types.maybeNull(types.string),
});

const Model = types
  .model({
    pid: types.optional(types.string, guidGenerator),

    readonly: types.optional(types.boolean, false),

    type: "taxonomy",
    children: Types.unionArray(["choice"]),
  })
  .volatile(() => ({
    maxUsagesReached: false,
  }))
  .views(self => ({
    get holdsState() {
      return true;
    },

    get valueType() {
      return "taxonomy";
    },

    get result() {
      if (self.perregion) {
        const area = self.annotation.highlightedNode;

        if (!area) return null;

        return self.annotation.results.find(r => r.from_name === self && r.area === area);
      }
      return self.annotation.results.find(r => r.from_name === self);
    },
  }))
  .extend(self => {
    // RDTS is uncontrolled component, so it handles selected values by itself.
    // We store path for selected items and store them separately for serialization.
    // It shall not trigger rerender every time, so it's not observable.
    let selected = [];

    return {
      views: {
        get holdsState() {
          return selected.length > 0;
        },
      },
      actions: {
        requiredModal() {
          Infomodal.warning(self.requiredmessage || `Taxonomy "${self.name}" is required.`);
        },

        needsUpdate() {
          if (self.result) selected = self.result.mainValue;
          else selected = [];
          self.maxUsagesReached = selected.length >= self.maxusages;
        },

        selectedValues() {
          return selected;
        },

        onChange(node, checked) {
          selected = checked.map(s => s.path ?? s);
          self.maxUsagesReached = selected.length >= self.maxusages;

          if (self.result) {
            self.result.area.setValue(self);
          } else {
            if (self.perregion) {
              const area = self.annotation.highlightedNode;

              if (!area) return null;
              area.setValue(self);
            } else {
              self.annotation.createResult({}, { taxonomy: selected }, self, self.toname);
            }
          }
        },

        traverse(root) {
          const maxusages = self.maxusages;
          const visitNode = function(node, parents = []) {
            const label = node.value;
            const path = [...parents, label];
            // @todo this check is heavy for long lists, optimize
            // search through last items in every stored path
            // if it's not saved as selected RDTS should handle it by its own, so undefined
            const checked = selected.some(p => isArraysEqual(p, path)) || undefined;
            const maxUsagesReached = !checked && maxusages && selected.length >= maxusages;
            // disable checkbox and hide it via styles if this node is not a leaf (=have children)
            const leafsOnly = self.leafsonly && !!node.children;
            const disabled = maxUsagesReached || leafsOnly;
            const obj = { label, path, checked, disabled, depth: parents.length };

            if (node.children) {
              obj.children = node.children.map(n => visitNode(n, path));
            }

            return obj;
          };

          return Array.isArray(root) ? root.map(n => visitNode(n)) : visitNode(root);
        },
      },
    };
  });

const TaxonomyModel = types.compose("TaxonomyModel", ControlBase, TagAttrs, Model, RequiredMixin, VisibilityMixin, AnnotationMixin);

function searchPredicate(node, searchTerm = "") {
  return !node.disabled && node.label?.toLowerCase().includes(searchTerm.toLowerCase());
}

const HtxTaxonomy = observer(({ item }) => {
  const style = { marginTop: "1em", marginBottom: "1em" };
  const options = {
    showFullPath: item.showfullpath,
    leafsOnly: item.leafsonly,
    pathSeparator: item.pathseparator,
  };

  return (
    <div style={{ ...style }}>
      <Taxonomy
        items={item.traverse(item.children)}
        selected={item.selectedValues()}
        onChange={item.onChange}
        options={options}
      />
      <DropdownTreeSelect
        key={item.maxUsagesReached}
        mode={item.leafsonly ? "hierarchical" : "multiSelect"}
        data={item.traverse(item.children)}
        onChange={item.onChange}
        texts={{ placeholder: "Click to add..." }}
        inlineSearchInput
        searchPredicate={searchPredicate}
        showPartiallySelected
      />
    </div>
  );
});

Registry.addTag("taxonomy", TaxonomyModel, HtxTaxonomy);

export { HtxTaxonomy, TaxonomyModel, TagAttrs };
