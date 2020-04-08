import React from "react";
import { observer } from "mobx-react";
import { types, getRoot } from "mobx-state-tree";

import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import Types from "../../core/Types";

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
 * @param {string} [visibleWhen]
 * @param {string} [whenTagName]
 * @param {string} [whenChoiceValue]
 */
const TagAttrs = types.model({
  classname: types.optional(types.string, ""),
  display: types.optional(types.string, "block"),
  style: types.maybeNull(types.string),

  visiblewhen: types.maybeNull(types.string),
  whentagname: types.maybeNull(types.string),
  whenchoicevalue: types.maybeNull(types.string),
  whenlabelvalue: types.maybeNull(types.string),
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
      "text",
      "audio",
      "image",
      "hypertext",
      "audioplus",
      "list",
      "dialog",
      "textarea",
      "pairwise",
      "style",
      "label",
      "relations",
      "filter",
    ]),
  })
  .views(self => ({
    get completion() {
      return getRoot(self).completionStore.selected;
    },
  }));

const ViewModel = types.compose("ViewModel", TagAttrs, Model);

const HtxView = observer(({ item, store }) => {
  let style = {};

  if (item.display === "inline") {
    style = { display: "inline-block", marginRight: "15px" };
  }

  if (item.style) {
    style = Tree.cssConverter(item.style);
  }

  if (item.visiblewhen) {
    const fns = {
      "region-selected": ({ tagName, labelValue }) => {
        const reg = item.completion.highlightedNode;
        if (reg === null || reg === undefined || (tagName && reg.parent.name != tagName)) {
          return false;
        }

        if (labelValue) return reg.hasLabelState(labelValue);

        return true;
      },

      filter: () => {},

      "choice-selected": ({ tagName, choiceValue }) => {
        const tag = item.completion.names.get(tagName);

        if (!tag) return false;

        return choiceValue ? tag.findLabel(choiceValue).selected : tag.isSelected;
      },

      "no-region-selected": ({ tagName }) => item.completion.highlightedNode === null,
    };

    if (Object.keys(fns).includes(item.visiblewhen)) {
      const res = fns[item.visiblewhen]({
        tagName: item.whentagname,
        choiceValue: item.whenchoicevalue,
        labelValue: item.whenlabelvalue,
      });

      if (res === false) style["display"] = "none";
    }
  }

  return (
    <div className={item.classname} style={style}>
      {Tree.renderChildren(item)}
    </div>
  );
});

Registry.addTag("view", ViewModel, HtxView);

export { HtxView, ViewModel };
