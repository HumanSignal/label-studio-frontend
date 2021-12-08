import React from "react";
import { types } from "mobx-state-tree";
import { observer } from "mobx-react";

import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import Types from "../../core/Types";

const LayoutModel = types.model(
  "LayoutModel",
  {
    type: "layout",
    value: types.optional(types.string, ""),
    layout: types.optional(types.string, "horizontal"),
    children: Types.unionArray([
      "view",
      "header",
      "labels",
      "label",
      "layout",
      "table",
      "taxonomy",
      "choices",
      "choice",
      "collapse",
      "number",
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
      "video",
      "videorectangle",
    ]),
  },
);

const styles = {
  horizontal: { display: "flex", alignItems: "start", gap: "30px" },
  vertical: {},
};

const HtxStyle = observer(({ item }) => {
  return (
    <div style={styles[item.layout] ?? styles.horizontal}>
      {Tree.renderChildren(item)}
    </div>
  );
});

Registry.addTag("layout", LayoutModel, HtxStyle);

export { HtxStyle, LayoutModel };
