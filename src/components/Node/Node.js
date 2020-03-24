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

const pt = { paddingTop: "4px" };

const NodeViews = {
  TextRegionModel: (node, click) => (
    <Fragment>
      <span onClick={click} className={styles.node}>
        <FontColorsOutlined style={pt} />
        &nbsp;
        {node.text.substring(0, 23)}
        {node.text.length > 26 && "..."}
      </span>
    </Fragment>
  ),

  HyperTextRegionModel: (node, click) => (
    <Fragment>
      <span onClick={click} className={styles.node}>
        <FontColorsOutlined style={pt} />
        &nbsp; HTML &nbsp;
        <span style={{ color: "#5a5a5a" }}>{node.text}</span>
      </span>
    </Fragment>
  ),

  AudioRegionModel: (node, click) => (
    <Fragment>
      <span onClick={click} className={styles.node}>
        <AudioOutlined style={pt} />
        &nbsp; Audio {node.start.toFixed(2)} - {node.end.toFixed(2)}
      </span>
    </Fragment>
  ),

  TextAreaRegionModel: (node, click) => (
    <Fragment>
      <MessageOutlined style={pt} />
      <span onClick={click} className={styles.node}>
        &nbsp; Input <span style={{ color: "#5a5a5a" }}>{node._value}</span>
      </span>
    </Fragment>
  ),

  RectRegionModel: (node, click) => {
    const w = node.width * node.scaleX;
    const y = node.height * node.scaleY;
    return (
      <Fragment>
        <BlockOutlined style={pt} />
        <span onClick={click} className={styles.node}>
          &nbsp; Rectangle {w.toFixed(2)} x {y.toFixed(2)}
        </span>
      </Fragment>
    );
  },

  PolygonRegionModel: (node, click) => (
    <Fragment>
      <span onClick={click} className={styles.node}>
        <GatewayOutlined style={pt} />
        &nbsp; Polygon
      </span>
    </Fragment>
  ),

  EllipseRegionModel: (node, click) => {
    const radiusX = node.radiusX * node.scaleX;
    const radiusY = node.radiusY * node.scaleY;
    const rotation = node.rotation;
    return (
      <Fragment>
        <span onClick={click} className={styles.node}>
          <Loading3QuartersOutlined style={pt} />
          &nbsp; Ellipse {radiusX.toFixed(2)} x {radiusY.toFixed(2)}, θ = {rotation.toFixed(2)}°, center = (
          {node.x.toFixed(2)}, {node.y.toFixed(2)})
        </span>
      </Fragment>
    );
  },

  KeyPointRegionModel: (node, click) => (
    <Fragment>
      <span onClick={click} className={styles.node}>
        <EyeOutlined style={pt} />
        &nbsp; KeyPoint
      </span>
    </Fragment>
  ),

  BrushRegionModel: (node, click) => (
    <Fragment>
      <span onClick={click} className={styles.node}>
        <HighlightOutlined style={pt} />
        &nbsp; Brush
      </span>
    </Fragment>
  ),

  ChoicesModel: (node, click) => (
    <Fragment>
      <ApartmentOutlined style={pt} />
      <span onClick={click} className={styles.node}>
        &nbsp; Classification
      </span>
    </Fragment>
  ),

  TextAreaModel: (node, click) => (
    <Fragment>
      <MessageOutlined style={pt} />
      <span onClick={click} className={styles.node}>
        &nbsp; Input
      </span>
    </Fragment>
  ),
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

  return NodeViews[name](node, onClick || click);
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
