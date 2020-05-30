import React, { Fragment } from "react";
import { Icon } from "antd";
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
  TextRegionModel: [FontColorsOutlined, node => <span className={null}>{node.text.substring(0, 100)}</span>],

  HyperTextRegionModel: [FontColorsOutlined, node => <span style={{ color: "#5a5a5a" }}>{node.text}</span>],

  AudioRegionModel: [AudioOutlined, node => `Audio ${node.start.toFixed(2)} - ${node.end.toFixed(2)}`],

  TextAreaRegionModel: [
    MessageOutlined,
    node => (
      <Fragment>
        Input <span style={{ color: "#5a5a5a" }}>{node._value}</span>
      </Fragment>
    ),
  ],

  RectRegionModel: [
    BlockOutlined,
    node => {
      const w = node.width * node.scaleX;
      const y = node.height * node.scaleY;
      return `Rectangle ${w.toFixed(2)} x ${y.toFixed(2)}`;
    },
  ],

  PolygonRegionModel: [GatewayOutlined, () => `Polygon`],

  EllipseRegionModel: [
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
  KeyPointRegionModel: [EyeOutlined, () => `KeyPoint`],

  BrushRegionModel: [HighlightOutlined, () => `Brush`],

  ChoicesModel: [ApartmentOutlined, () => `Classification`],

  TextAreaModel: [MessageOutlined, () => `Input`],
};

const Node = observer(({ node, onClick }) => {
  const click = ev => {
    ev.preventDefault();
    getRoot(node).completionStore.selected.regionStore.unselectAll();

    node.selectRegion();

    return false;
  };

  const name = getType(node).name;
  if (!(name in NodeViews)) console.error(`No ${name} in NodeView`);

  const [Icon, getContent] = NodeViews[name];

  return (
    <span onClick={onClick || click} className={styles.node}>
      <Icon />
      {getContent(node)}
    </span>
  );
});

const NodeMinimal = ({ node }) => {
  if (getType(node).name === "TextRegionModel") {
    return (
      <Fragment>
        <FontColorsOutlined /> &nbsp; Text
      </Fragment>
    );
  }

  if (getType(node).name === "RectRegionModel") {
    return (
      <Fragment>
        <BlockOutlined />
        &nbsp; Rect
      </Fragment>
    );
  }

  if (getType(node).name === "EllipseRegionModel") {
    return (
      <Fragment>
        <Loading3QuartersOutlined />
        &nbsp; Ellipse
      </Fragment>
    );
  }

  if (getType(node).name === "AudioRegionModel") {
    return (
      <Fragment>
        <AudioOutlined />
        &nbsp; Audio
      </Fragment>
    );
  }

  if (getType(node).name === "TextAreaRegionModel") {
    return (
      <Fragment>
        <MessageOutlined />
        &nbsp; Input
      </Fragment>
    );
  }

  if (getType(node).name === "HyperTextRegionModel") {
    return (
      <Fragment>
        <FontColorsOutlined /> &nbsp; HTML
      </Fragment>
    );
  }

  if (getType(node).name === "PolygonRegionModel") {
    return (
      <Fragment>
        <GatewayOutlined />
        &nbsp; Polygon
      </Fragment>
    );
  }

  if (getType(node).name === "KeyPointRegionModel") {
    return (
      <Fragment>
        <EyeOutlined />
        &nbsp; KeyPoint
      </Fragment>
    );
  }

  if (getType(node).name === "BrushRegionModel") {
    return (
      <Fragment>
        <HighlightOutlined />
        &nbsp; Brush
      </Fragment>
    );
  }
};

export { Node, NodeMinimal };
