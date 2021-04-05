import { getType, getRoot } from "mobx-state-tree";
import { observer } from "mobx-react";
import {
  FontColorsOutlined,
  AudioOutlined,
  MessageOutlined,
  BlockOutlined,
  GatewayOutlined,
  LineChartOutlined,
  Loading3QuartersOutlined,
  EyeOutlined,
  HighlightOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";

import styles from "./Node.module.scss";
import "./Node.styl";
import { Block, Elem } from "../../utils/bem";

const NodeViews = {
  TextRegionModel: ["Text", FontColorsOutlined, node => <span className={null}>{node.text.substring(0, 100)}</span>],

  HyperTextRegionModel: ["HTML", FontColorsOutlined, node => <span style={{ color: "#5a5a5a" }}>{node.text}</span>],

  ParagraphsRegionModel: [
    "Paragraphs",
    FontColorsOutlined,
    node => <span style={{ color: "#5a5a5a" }}>{node.text}</span>,
  ],

  AudioRegionModel: ["Audio", AudioOutlined, node => `Audio ${node.start.toFixed(2)} - ${node.end.toFixed(2)}`],

  TimeSeriesRegionModel: [
    "TimeSeries",
    LineChartOutlined,
    node => `TS ${node.object.formatTime(node.start)} - ${node.object.formatTime(node.end)}`,
  ],

  TextAreaRegionModel: ["Input", MessageOutlined, node => <span style={{ color: "#5a5a5a" }}>{node._value}</span>],

  RectRegionModel: [
    "Rect",
    BlockOutlined,
    node => {
      const w = node.width * node.scaleX;
      const h = node.height * node.scaleY;
      return `Rectangle ${w.toFixed(2)} x ${h.toFixed(2)}`;
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
  KeyPointRegionModel: [
    "KeyPoint",
    EyeOutlined,
    node => `KeyPoint ${node.relativeX.toFixed(2)}, ${node.relativeY.toFixed(2)}`,
  ],

  BrushRegionModel: ["Brush", HighlightOutlined, () => `Brush`],

  ChoicesModel: ["Classification", ApartmentOutlined, () => `Classification`],

  TextAreaModel: ["Input", MessageOutlined, () => `Input`],
};

const Node = observer(({ className, node }) => {
  const name = getType(node).name;
  if (!(name in NodeViews)) console.error(`No ${name} in NodeView`);

  let [, Icon, getContent] = NodeViews[name];

  if (node.labelsState) {
    const aliases = node.labelsState.selectedAliases;
    if (aliases.length)
      Icon = function() {
        return <span className={styles.alias}>{aliases.join(",")}</span>;
      };
  }

  return (
    <span className={[styles.node, className].filter(Boolean).join(" ")}>
      <Icon />
      {getContent(node)}
    </span>
  );
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

export { Node, NodeMinimal };
