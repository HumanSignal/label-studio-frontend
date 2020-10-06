import React, { Fragment } from "react";
import { Badge } from "antd";
import { getType, getRoot } from "mobx-state-tree";
import { observer } from "mobx-react";
import {
  FontColorsOutlined,
  AudioOutlined,
  MessageOutlined,
  BlockOutlined,
  GatewayOutlined,
  Loading3QuartersOutlined,
  EyeOutlined,
  HighlightOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";

import styles from "./Node.module.scss";

const NodeViews = {
  TextRegionModel: ["Text", FontColorsOutlined, node => <span className={null}>{node.text.substring(0, 100)}</span>],

  HyperTextRegionModel: ["HTML", FontColorsOutlined, node => <span style={{ color: "#5a5a5a" }}>{node.text}</span>],

  AudioRegionModel: ["Audio", AudioOutlined, node => `Audio ${node.start.toFixed(2)} - ${node.end.toFixed(2)}`],

  TextAreaRegionModel: [
    "Input",
    MessageOutlined,
    node => (
      <Fragment>
        Input <span style={{ color: "#5a5a5a" }}>{node._value}</span>
      </Fragment>
    ),
  ],

  RectRegionModel: [
    "Rect",
    BlockOutlined,
    node => {
      const w = node.width * node.scaleX;
      const y = node.height * node.scaleY;
      return `Rectangle ${w.toFixed(2)} x ${y.toFixed(2)}`;
    },
  ],

  PolygonRegionModel: ["Polygon", GatewayOutlined, () => `Polygon`],

  EllipseRegionModel: [
    "Ellipse",
    Loading3QuartersOutlined,
    node => {
      const radiusX = node.radiusX * node.scaleX;
      const radiusY = node.radiusY * node.scaleY;
      const rotation = node.rotation;
      return `Ellipse ${radiusX.toFixed(2)} x ${radiusY.toFixed(2)}, θ = ${rotation.toFixed(2)}°,
        center = (${node.x.toFixed(2)}, ${node.y.toFixed(2)})`;
    },
  ],

  // @todo add coords
  KeyPointRegionModel: ["KeyPoint", EyeOutlined, () => `KeyPoint`],

  BrushRegionModel: ["Brush", HighlightOutlined, () => `Brush`],

  ChoicesModel: ["Classification", ApartmentOutlined, () => `Classification`],

  TextAreaModel: ["Input", MessageOutlined, () => `Input`],
};

const Node = observer(({ className, node }) => {
  const name = getType(node).name;
  if (!(name in NodeViews)) console.error(`No ${name} in NodeView`);

  const [, Icon, getContent] = NodeViews[name];

  return (
    <span className={[styles.node, className].filter(Boolean).join(" ")}>
      <Icon />
      {getContent(node)}
    </span>
  );
});

const NodeMinimal = observer(({ node }) => {
  const { sortedRegions: regions } = getRoot(node).completionStore.selected.regionStore;
  const index = regions.indexOf(node);
  const name = getType(node).name;
  if (!(name in NodeViews)) return null;

  const oneColor = node.getOneColor();
  let badgeStyle = {};

  if (oneColor) {
    badgeStyle = {
      backgroundColor: oneColor,
    };
  } else {
    badgeStyle = {
      backgroundColor: "#fff",
      color: "#999",
      boxShadow: "0 0 0 1px #d9d9d9 inset",
    };
  }

  const [text, Icon] = NodeViews[name];
  return (
    <span className={styles.minimal}>
      {index >= 0 && <Badge count={index + 1} style={badgeStyle} />}
      <Icon />
      {text}
    </span>
  );
});

export { Node, NodeMinimal };
