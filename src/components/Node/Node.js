import React, { Fragment } from "react";
import { Icon } from "antd";
import { getType, getRoot } from "mobx-state-tree";
import { observer } from "mobx-react";

import styles from "./Node.module.scss";

const pt = { paddingTop: "3px" };

const NodeViews = {
  TextRegionModel: (node, click) => (
    <Fragment>
      <span onClick={click} className={styles.node}>
        <Icon type="font-colors" style={pt} />
        &nbsp; Text: &nbsp;
        {node.text.substring(0, 25)}
        {node.text.length > 28 && "..."}
      </span>
    </Fragment>
  ),

  HyperTextRegionModel: (node, click) => (
    <div onClick={click}>
      <Icon type="font-colors" style={pt} />
      &nbsp; HTML &nbsp;
      <span style={{ color: "#5a5a5a" }}>{node.text}</span>
    </div>
  ),

  AudioRegionModel: (node, click) => (
    <Fragment>
      <span onClick={click} className={styles.node}>
        <Icon type="audio" style={pt} />
        &nbsp; Audio {node.start.toFixed(2)} - {node.end.toFixed(2)}
      </span>
    </Fragment>
  ),

  TextAreaRegionModel: (node, click) => (
    <Fragment>
      <Icon type="message" style={pt} />
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
        <Icon type="block" style={pt} />
        <span onClick={click} className={styles.node}>
          &nbsp; Rectangle {w.toFixed(2)} x {y.toFixed(2)}
        </span>
      </Fragment>
    );
  },

  PolygonRegionModel: (node, click) => (
    <Fragment>
      <span onClick={click} className={styles.node}>
        <Icon type="gateway" style={pt} />
        &nbsp; Polygon
      </span>
    </Fragment>
  ),

  KeyPointRegionModel: (node, click) => (
    <p>
      <Icon type="eye" style={pt} />
      <span onClick={click} className={styles.node}>
        &nbsp; KeyPoint
      </span>
    </p>
  ),

  BrushRegionModel: (node, click) => (
    <p>
      <Icon type="highlight" style={pt} />
      <span onClick={click} className={styles.node}>
        &nbsp; Brush
      </span>
    </p>
  ),
};

const Node = observer(({ node }) => {
  const click = ev => {
    ev.preventDefault();
    getRoot(node).completionStore.selected.regionStore.unselectAll();

    node.selectRegion();

    return false;
  };

  const name = getType(node).name;
  if (!(name in NodeViews)) console.error(`No ${name} in NodeView`);

  return NodeViews[name](node, click);
});

const NodeMinimal = ({ node }) => {
  if (getType(node).name === "TextRegionModel") {
    return (
      <Fragment>
        <Icon type="font-colors" /> &nbsp; Text
      </Fragment>
    );
  }

  if (getType(node).name === "RectRegionModel") {
    return (
      <Fragment>
        <Icon type="block" />
        &nbsp; Rectangle
      </Fragment>
    );
  }

  if (getType(node).name === "AudioRegionModel") {
    return (
      <Fragment>
        <Icon type="audio" />
        &nbsp; Audio
      </Fragment>
    );
  }

  if (getType(node).name === "TextAreaRegionModel") {
    return (
      <Fragment>
        <Icon type="message" />
        &nbsp; Input
      </Fragment>
    );
  }

  if (getType(node).name === "HyperTextRegionModel") {
    return (
      <Fragment>
        <Icon type="font-colors" /> &nbsp; HTML
      </Fragment>
    );
  }

  if (getType(node).name === "PolygonRegionModel") {
    return (
      <Fragment>
        <Icon type="gateway" />
        &nbsp; Polygon
      </Fragment>
    );
  }

  if (getType(node).name === "KeyPointRegionModel") {
    return (
      <Fragment>
        <Icon type="eye" />
        &nbsp; KeyPoint
      </Fragment>
    );
  }

  if (getType(node).name === "BrushRegionModel") {
    return (
      <Fragment>
        <Icon type="highlight" />
        &nbsp; Brush
      </Fragment>
    );
  }
};

export { Node, NodeMinimal };
