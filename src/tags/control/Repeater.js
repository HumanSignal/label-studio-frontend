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


function CloneTreeWithIndex(node, store, idxcount) {
  function cloneAndReplaceKeys(node) {
    let copy = {};
    for (let key in node) {
      if (key === 'children') {
        copy.children = node.children.map(c => cloneAndReplaceKeys(c));
      } else if (typeof node[key] === 'string') {
        copy[key] = node[key].replace('{{idx}}', idxcount);
      } else {
        copy[key] = node[key];
      }
    }

    copy.id = guidGenerator();
    return copy;
  }

  const clonedSnapshot = cloneAndReplaceKeys(node['$treenode']['_initialSnapshot']);
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

  cloned.$treenode._parent = node.$treenode._parent;

  return cloned;
}



function renderDuplicateTree(item, idx, store) {

  let clone = CloneTreeWithIndex(item, store, idx);

  return (
    <div key={idx}>
      {Tree.renderChildren(clone)}
    </div>
  );
} 

const HtxListView = ({ store, item }) => {
  return (
    <div>
      {item.iterateOver.map((e, idx) => renderDuplicateTree(item, idx, store))}
    </div>
  );
};

const HtxList = inject("store")(observer(HtxListView));


Registry.addTag("repeater", RepaterModel, HtxList);

export { RepaterModel };
