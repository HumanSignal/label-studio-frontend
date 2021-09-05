import React from "react";
import { getRoot, getType } from "mobx-state-tree";
import { observer } from "mobx-react";
import {
  ApartmentOutlined,
  AudioOutlined,
  FontColorsOutlined,
  LineChartOutlined,
  MessageOutlined
} from "@ant-design/icons";

import styles from "./Node.module.scss";
import "./Node.styl";
import { Block, Elem } from "../../utils/bem";
import { IconBrushTool, IconBrushToolSmart, IconCircleTool, IconCircleToolSmart, IconKeypointsTool, IconKeypointsToolSmart, IconPolygonTool, IconPolygonToolSmart, IconRectangleTool, IconRectangleToolSmart } from "../../assets/icons";
import { NodeView } from "./NodeView";

const NodeViews = {
  RichTextRegionModel: NodeView({
    name: "HTML",
    icon: FontColorsOutlined,
    getContent: node => <span style={{ color: "#5a5a5a" }}>{node.text}</span>,
  }),

  ParagraphsRegionModel: NodeView({
    name: "Paragraphs",
    icon: FontColorsOutlined,
    getContent: node => <span style={{ color: "#5a5a5a" }}>{node.text}</span>,
  }),

  AudioRegionModel: NodeView({
    name: "Audio",
    icon: AudioOutlined,
  }),

  TimeSeriesRegionModel: NodeView({
    name: "TimeSeries",
    icon: LineChartOutlined,
  }),

  TextAreaRegionModel: NodeView({
    name: "Input",
    icon: MessageOutlined,
    getContent: node => <span style={{ color: "#5a5a5a" }}>{node._value}</span>,
  }),

  RectRegionModel: NodeView({
    name: "Rect",
    icon: IconRectangleTool,
    altIcon: IconRectangleToolSmart,
  }),

  PolygonRegionModel: NodeView({
    name: "Polygon",
    icon: IconPolygonTool,
    altIcon: IconPolygonToolSmart,
  }),

  EllipseRegionModel: NodeView({
    name: "Ellipse",
    icon: IconCircleTool,
    altIcon: IconCircleToolSmart,
  }),

  // @todo add coords
  KeyPointRegionModel: NodeView({
    name: "KeyPoint",
    icon: IconKeypointsTool,
    altIcon: IconKeypointsToolSmart,
  }),

  BrushRegionModel: NodeView({
    name: "Brush",
    icon: IconBrushTool,
    altIcon: IconBrushToolSmart,
  }),

  ChoicesModel: NodeView({
    name: "Classification",
    icon: ApartmentOutlined,
  }),

  TextAreaModel: NodeView({
    name: "Input",
    icon: MessageOutlined,
  }),
};

const Node = observer(({ className, node }) => {
  const name = getType(node).name;

  if (!(name in NodeViews)) console.error(`No ${name} in NodeView`);

  let { getContent } = NodeViews[name];
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

  const { icon: Icon } = NodeViews[name];

  return <Icon />;
});

const NodeMinimal = observer(({ node }) => {
  const { sortedRegions: regions } = getRoot(node).annotationStore.selected.regionStore;
  const index = regions.indexOf(node);
  const name = getType(node).name;

  if (!(name in NodeViews)) return null;

  const { name: text, Icon } = NodeViews[name];

  return (
    <Block name="node-minimal" tag="span">
      {index >= 0 && <Elem name="counter">{index + 1}</Elem>}

      <Elem name="icon" tag={Icon}/>

      {text}
    </Block>
  );
});

export { Node, NodeIcon, NodeMinimal, NodeViews };
