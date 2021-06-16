import React from "react";
import { observer, inject } from "mobx-react";
import { types } from "mobx-state-tree";

import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import {guidGenerator} from "../../core/Helpers";
import Types from "../../core/Types";
import VisibilityMixin from "../../mixins/Visibility";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import { variableNotation } from "../../core/Template";

const TagAttrs = types.model({
  classname: types.optional(types.string, ""),
  display: types.optional(types.string, "block"),
  style: types.maybeNull(types.string),
});

const Model = types
  .model({
    type: "repeater",
    on: types.maybeNull(types.string),
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
      "richtext",
      "timeseries",
      "audioplus",
      "list",
      "complex",
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
  .views(self => ({}))
  .actions(self => ({
    updateValue(store) {
      self.iterateOver = variableNotation(self.on, store.task.dataObj);
    }
  })
  );

const RepaterModel = types.compose("RepaterModel", TagAttrs, Model, VisibilityMixin, AnnotationMixin);


function RenderDuplicateTree(props) {
  const {tree, idx, store} = props;
  function cloneAndReplaceKeys(node) {
    let copy = {};
    for (let key in node) {
      if (key === 'children') {
        copy.children = node.children.map(c => cloneAndReplaceKeys(c));
      } else if (typeof node[key] === 'string') {
        copy[key] = node[key].replace('{{idx}}', idx);
      } else {
        copy[key] = node[key];
      }
    }

    copy.id = guidGenerator();
    return copy;
  }

  const clonedSnapshot = cloneAndReplaceKeys(tree['$treenode']['_initialSnapshot']);
  const cloned =  Registry.getModelByTag("view").create({
    id: guidGenerator(),
    tagName: "View",
    type: "view",
    children: clonedSnapshot.children,
  });

  Tree.traverseTree(cloned, function(node) {
    if (store && store.task && node.updateValue) {
      node.updateValue(store);
    }
  });

  cloned.$treenode._parent = tree.$treenode._parent;

  return Tree.renderChildren(cloned);
}
const DuplicatedTree = inject("store")(observer(RenderDuplicateTree));


const HtxRepeater = ({ item }) => {
  return (
    <div>
      {item.iterateOver.map((_e, idx) => 
        <DuplicatedTree key={idx} tree={item} idx={idx} />
      )}
    </div>
  );
};


Registry.addTag("repeater", RepaterModel, /*inject("store")*/(HtxRepeater));

export { RepaterModel };
