import React from "react";
import { getRoot, getType } from "mobx-state-tree";
import { observer } from "mobx-react";
import {
  ApartmentOutlined,
  AudioOutlined,
  BlockOutlined,
  EyeOutlined,
  FontColorsOutlined,
  GatewayOutlined,
  HighlightOutlined,
  LineChartOutlined,
  Loading3QuartersOutlined,
  MessageOutlined
} from "@ant-design/icons";

import styles from "./Node.module.scss";
import "./Node.styl";
import { Block, Elem } from "../../utils/bem";

const NodeViews = {
  RichTextRegionModel: ["HTML", FontColorsOutlined, node => <span style={{ color: "#5a5a5a" }}>{node.text}</span>],

  ParagraphsRegionModel: [
    "Paragraphs",
    FontColorsOutlined,
    node => <span style={{ color: "#5a5a5a" }}>{node.text}</span>,
  ],

  AudioRegionModel: ["Audio", AudioOutlined, () => null],

  TimeSeriesRegionModel: [
    "TimeSeries",
    LineChartOutlined,
    () => null,
  ],

  TextAreaRegionModel: ["Input", MessageOutlined, node => <span style={{ color: "#5a5a5a" }}>{node._value}</span>],

  RectRegionModel: [
    "Rect",
    BlockOutlined,
    () => null,
  ],

  PolygonRegionModel: ["Polygon", GatewayOutlined, () => null],

  EllipseRegionModel: [
    "Ellipse",
    Loading3QuartersOutlined,
    () => null,
  ],

  // @todo add coords
  KeyPointRegionModel: [
    "KeyPoint",
    EyeOutlined,
    () => null,
  ],

  BrushRegionModel: ["Brush", HighlightOutlined, () => null],

  ChoicesModel: ["Classification", ApartmentOutlined, () => null],

  TextAreaModel: ["Input", MessageOutlined, () => null],
};

const Node = observer(({ className, node }) => {
  const name = getType(node).name;

  if (!(name in NodeViews)) console.error(`No ${name} in NodeView`);

  let [, , getContent] = NodeViews[name];
  const labelName = node.labelName;

  return (
    <span className={[styles.node, className].filter(Boolean).join(" ")}>
      {labelName}
      {" "}
      {getContent(node)}
    </span>
  );
});

const NodeIcon = observer(({ node }) => {
  const name = getType(node).name;

  if (!(name in NodeViews)) console.error(`No ${name} in NodeView`);

  const Icon = NodeViews[name][1];

  return <Icon />;
});

const NodeMinimal = observer(({ node }) => {
  const { sortedRegions: regions } = getRoot(node).annotationStore.selected.regionStore;
  const index = regions.indexOf(node);
  const name = getType(node).name;

  if (!(name in NodeViews)) return null;

  const [text, Icon] = NodeViews[name];

  return (
    <Block name="node-minimal" tag="span">
      {index >= 0 && <Elem name="counter">{index + 1}</Elem>}

      <Elem name="icon" tag={Icon}/>

      {text}
    </Block>
  );
});

export { Node, NodeIcon, NodeMinimal, NodeViews };
