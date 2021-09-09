import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import Infomodal from "../../components/Infomodal/Infomodal";
import { Taxonomy } from "../../components/Taxonomy/Taxonomy";
import { guidGenerator } from "../../core/Helpers";
import Registry from "../../core/Registry";
import Types from "../../core/Types";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import PerRegionMixin from "../../mixins/PerRegion";
import RequiredMixin from "../../mixins/Required";
import VisibilityMixin from "../../mixins/Visibility";
import ControlBase from "./Base";

/**
 * Use the Taxonomy tag to create one or more hierarchical classifications, storing both choice selections and their ancestors in the results. Use for nested classification tasks with the Choice tag.
 *
 * Use with the following data types: audio, image, HTML, paragraphs, text, time series, video
 * @example
 * <!--Labeling configuration for providing a taxonomy of choices in response to a passage of text -->
 * <View>
 *   <Taxonomy name="media" toName="text">
 *     <Choice value="Online">
 *       <Choice value="UGC" />
 *       <Choice value="Free" />
 *       <Choice value="Paywall">
 *         <Choice value="NY Times" />
 *         <Choice value="The Wall Street Journal" />
 *       </Choice>
 *     </Choice>
 *     <Choice value="Offline" />
 *   </Taxonomy>
 *   <Text name="text" value="You'd never believe what he did to the country" />
 * </View>
 * @name Taxonomy
 * @meta_title Taxonomy Tag for Hierarchical Labels
 * @meta_description Customize Label Studio with the Taxonomy tag and use hierarchical labels for machine learning and data science projects.
 * @param {string} name                - Name of the element
 * @param {string} toName              - Name of the element that you want to classify
 * @param {boolean} [leafsOnly=false]  - Allow annotators to select only leaf nodes of taxonomy
 * @param {boolean} [showFullPath=false] - Whether to show the full path of selected items
 * @param {string} [pathSeparator= / ] - Separator to show in the full path
 * @param {number} [maxUsages]         - Maximum number of times a choice can be selected per task
 * @param {boolean} [required=false]   - Whether taxonomy validation is required
 * @param {string} [requiredMessage]   - Message to show if validation fails
 * @param {string} [placeholder=]      - What to display as prompt on the input
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),
  leafsonly: types.optional(types.boolean, false),
  showfullpath: types.optional(types.boolean, false),
  pathseparator: types.optional(types.string, " / "),
  placeholder: "",
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
    selected: [],
  }))
  .views(self => ({
    get holdsState() {
      return self.selected.length > 0;
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
  .actions(self => ({
    requiredModal() {
      Infomodal.warning(self.requiredmessage || `Taxonomy "${self.name}" is required.`);
    },

    needsUpdate() {
      if (self.result) self.selected = self.result.mainValue;
      else self.selected = [];
      self.maxUsagesReached = self.selected.length >= self.maxusages;
    },

    selectedValues() {
      return self.selected;
    },

    updateFromResult() {
      self.needsUpdate();
    },

    onChange(node, checked) {
      self.selected = checked.map(s => s.path ?? s);
      self.maxUsagesReached = self.selected.length >= self.maxusages;

      if (self.result) {
        self.result.area.setValue(self);
      } else {
        if (self.perregion) {
          const area = self.annotation.highlightedNode;

          if (!area) return null;
          area.setValue(self);
        } else {
          self.annotation.createResult({}, { taxonomy: self.selected }, self, self.toname);
        }
      }
    },

    traverse(root) {
      const visitNode = function(node, parents = []) {
        const label = node.value;
        const path = [...parents, label]; // @todo node.alias || label; problems with showFullPath
        const obj = { label, path, depth: parents.length };

        if (node.children) {
          obj.children = node.children.map(n => visitNode(n, path));
        }

        return obj;
      };

      return Array.isArray(root) ? root.map(n => visitNode(n)) : visitNode(root);
    },
  }));

const TaxonomyModel = types.compose("TaxonomyModel", ControlBase, TagAttrs, Model, RequiredMixin, PerRegionMixin, VisibilityMixin, AnnotationMixin);

const HtxTaxonomy = observer(({ item }) => {
  const style = { marginTop: "1em", marginBottom: "1em" };
  const visibleStyle = item.perRegionVisible() ? {} : { display: "none" };
  const options = {
    showFullPath: item.showfullpath,
    leafsOnly: item.leafsonly,
    pathSeparator: item.pathseparator,
    maxUsages: item.maxusages,
    placeholder: item.placeholder,
  };

  return (
    <div style={{ ...style, ...visibleStyle }}>
      <Taxonomy
        items={item.traverse(item.children)}
        selected={item.selected}
        onChange={item.onChange}
        options={options}
      />
    </div>
  );
});

Registry.addTag("taxonomy", TaxonomyModel, HtxTaxonomy);

export { HtxTaxonomy, TaxonomyModel, TagAttrs };
