import React from "react";
import { getRoot, getType } from "mobx-state-tree";
import { observer } from "mobx-react";
import {
  ApartmentOutlined,
  AudioOutlined,
  LineChartOutlined,
  MessageOutlined
} from "@ant-design/icons";

import styles from "./Node.module.scss";
import "./Node.styl";
import { Block, Elem } from "../../utils/bem";
import { IconBrushTool, IconBrushToolSmart, IconCircleTool, IconCircleToolSmart, IconKeypointsTool, IconKeypointsToolSmart, IconPolygonTool, IconPolygonToolSmart, IconRectangleTool, IconRectangleToolSmart, IconText } from "../../assets/icons";
import { NodeView } from "./NodeView";

const NodeViews = {
  RichTextRegionModel: {
    name: "HTML",
    icon: IconText,
    getContent: node => <span style={{ color: "#5a5a5a" }}>{node.text}</span>,
    fullContent: node => (
      <div>
        {/* <div style={{ color: "#5a5a5a" }}>{node.text}</div> */}
        <div>{node.start}</div>
        <div>{node.startOffset}</div>
        <div>{JSON.stringify(node.globalOffsets, null, 2)}</div>
      </div>
    ),
  },

  ParagraphsRegionModel: NodeView({
    name: "Paragraphs",
    icon: IconText,
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

  VideoRectangleRegionModel: NodeView({
    name: "Video Rect",
    icon: IconRectangleTool,
    altIcon: IconRectangleToolSmart,
    getContent: node => <span style={{ color: "#5a5a5a" }}>from {node.sequence[0]?.frame} frame</span>,
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

const NodeDebug = observer(({ className, node }) => {
  const name = getType(node).name;

  if (!(name in NodeViews)) console.error(`No ${name} in NodeView`);

  const { getContent, fullContent } = NodeViews[name];
  const labelName = node.labelName;

  return (
    <div className={[styles.node, className].filter(Boolean).join(" ")}>
      {labelName}
      <br/>
      {getContent(node)}
      {fullContent && fullContent(node)}
    </div>
  );
});

const Node = observer(({ className, node }) => {
  const name = getType(node).name;

  if (!(name in NodeViews)) console.error(`No ${name} in NodeView`);

  const { getContent } = NodeViews[name];
  const labelName = node.labelName;

  return (
    <span className={[styles.node, className].filter(Boolean).join(" ")}>
      {labelName}
      {" "}
      {getContent(node)}
    </span>
  );
});

const NodeIcon = observer(({ node, ...props }) => {
  const name = getType(node).name;

  if (!(name in NodeViews)) console.error(`No ${name} in NodeView`);

  const { icon: Icon } = NodeViews[name];

  return <Icon {...props}/>;
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

export { Node, NodeDebug, NodeIcon, NodeMinimal, NodeViews };
