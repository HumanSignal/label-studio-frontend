import React from "react";
import { observer } from "mobx-react";
import { types, getRoot } from "mobx-state-tree";

import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import Types from "../../core/Types";
import VisibilityMixin from "../../mixins/Visibility";

/**
 * View element. It's analogous to div element in html and can be used to visual configure display of blocks
 * @example
 * <View style="display: flex;">
 *   <View style="flex: 50%">
 *     <Header value="Facts:" />
 *     <Text name="text" value="$fact" />
 *   </View>
 *   <View style="flex: 50%; margin-left: 1em">
 *     <Header value="Enter your question:" />
 *     <TextArea name="question" />
 *   </View>
 * </View>
 * @name View
 * @param {block|inline} display
 * @param {string} [style] css style string
 * @param {string} [className] - class name of the css style to apply
 * @param {region-selected|choice-selected|no-region-selected} [visibleWhen] show the contents of a view when condition is true
 * @param {string} [whenTagName] narrow down visibility by name of the tag, for regions use the name of the object tag, for choices use the name of the choices tag
 * @param {string} [whenLabelValue] narrow down visibility by label value
 * @param {string} [whenChoiceValue] narrow down visibility by choice value
 */
const TagAttrs = types.model({
  classname: types.optional(types.string, ""),
  display: types.optional(types.string, "block"),
  style: types.maybeNull(types.string),
});

const Model = types
  .model({
    id: types.identifier,
    type: "view",
    children: Types.unionArray([
      "view",
      "header",
      "labels",
      "label",
      "table",
      "taxonomy",
      "choices",
      "choice",
      "rating",
      "ranker",
      "rectangle",
      "ellipse",
      "polygon",
      "keypoint",
      "brush",
      "rectanglelabels",
      "ellipselabels",
      "polygonlabels",
      "keypointlabels",
      "brushlabels",
      "hypertextlabels",
      "timeserieslabels",
      "text",
      "audio",
      "image",
      "hypertext",
      "timeseries",
      "audioplus",
      "list",
      "dialog",
      "textarea",
      "pairwise",
      "style",
      "label",
      "relations",
      "filter",
      "timeseries",
      "timeserieslabels",
      "paragraphs",
      "paragraphlabels",
    ]),
  })
  .views(self => ({
    get annotation() {
      return getRoot(self).annotationStore.selected;
    },
  }));

const ViewModel = types.compose("ViewModel", TagAttrs, Model, VisibilityMixin);

const HtxView = observer(({ item, store }) => {
  let style = {};

  if (item.display === "inline") {
    style = { display: "inline-block", marginRight: "15px" };
  }

  if (item.style) {
    style = Tree.cssConverter(item.style);
  }

  if (item.isVisible === false) {
    style["display"] = "none";
  }

  return (
    <div className={item.classname} style={style}>
      {Tree.renderChildren(item)}
    </div>
  );
});

Registry.addTag("view", ViewModel, HtxView);

export { HtxView, ViewModel };
