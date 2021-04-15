import { observer } from "mobx-react";
import React, { PureComponent, useEffect } from "react";
import { useState } from "react";
import NodesConnector from "./NodesConnector";

const ArrowMarker = ({ id, color }) => {
  return (
    <marker
      id={`arrow-${id}`}
      viewBox="0 0 10 10"
      refX={8}
      refY={5}
      markerWidth={4}
      markerHeight={4}
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
    </marker>
  );
};

const RelationItemRect = ({ x, y, width, height }) => {
  return <rect x={x} y={y} width={width} height={height} fill="none" />;
};

const RelationConnector = ({ id, command, color, direction, highlight }) => {
  const pathColor = highlight ? "#fa541c" : color;
  const pathSettings = {
    d: command,
    stroke: pathColor,
    fill: "none",
    strokeLinecap: "round",
  };

  const markers = {};

  if (direction === "bi" || direction === "right") {
    markers.markerEnd = `url(#arrow-${id})`;
  }
  if (direction === "bi" || direction === "left") {
    markers.markerStart = `url(#arrow-${id})`;
  }

  return (
    <>
      <defs>
        <ArrowMarker id={id} color={pathColor} />
      </defs>
      {highlight && <path {...pathSettings} stroke={color} opacity={0.1} strokeWidth={6} />}
      <path {...pathSettings} opacity={highlight ? 1 : 0.6} strokeWidth={2} {...markers} />
    </>
  );
};

const RelationLabel = ({ label, position }) => {
  const [x, y] = position;
  const textRef = React.createRef();
  const [background, setBackground] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const groupAttributes = {
    transform: `translate(${x}, ${y})`,
    textAnchor: "middle",
    dominantBaseline: "middle",
  };

  const textAttributes = {
    fill: "white",
    style: { fontSize: 12, fontFamily: "arial" },
  };

  useEffect(() => {
    const textElement = textRef.current;
    const bbox = textElement.getBBox();
    setBackground({
      x: bbox.x - 5,
      y: bbox.y - 3,
      width: bbox.width + 10,
      height: bbox.height + 6,
    });
  }, [label]);

  return (
    <g {...groupAttributes}>
      <rect {...background} stroke="#fff" strokeWidth={2} fill="#a0a" rx="3" />
      <text ref={textRef} {...textAttributes}>
        {label}
      </text>
    </g>
  );
};

const RelationItem = ({ id, startNode, endNode, direction, rootRef, highlight, dimm, labels, visible }) => {
  const root = rootRef.current;
  const nodesHidden = startNode.hidden === true || endNode.hidden === true;
  const hideConnection = nodesHidden || !visible;
  const [, forceUpdate] = useState();

  const relation = NodesConnector.connect({ id, startNode, endNode, direction, labels }, root);
  const { start, end } = NodesConnector.getNodesBBox({ root, ...relation });
  const [path, textPosition] = NodesConnector.calculatePath(start, end);

  useEffect(() => {
    relation.onChange(() => forceUpdate({}));
    return () => relation.destroy();
  }, []);

  return (
    <g opacity={dimm && !highlight ? 0.5 : 1} visibility={hideConnection ? "hidden" : "visible"}>
      <RelationItemRect {...start} />
      <RelationItemRect {...end} />
      <RelationConnector
        id={relation.id}
        command={path}
        color={relation.color}
        direction={relation.direction}
        highlight={highlight}
      />
      {relation.label && <RelationLabel label={relation.label} position={textPosition} />}
    </g>
  );
};

/**
 * @param {{
 * item: object,
 * rootRef: React.RefObject<HTMLElement>
 * }}
 */
const RelationItemObserver = observer(({ relation, ...rest }) => {
  const { node1: startNode, node2: endNode } = relation;

  return (
    <RelationItem id={relation.id} startNode={startNode} endNode={endNode} direction={relation.direction} {...rest} />
  );
});

class RelationsOverlay extends PureComponent {
  /** @type {React.RefObject<HTMLElement>} */
  rootNode = React.createRef();
  state = { shouldRender: false, souldRenderConnections: Math.random() };

  componentDidMount() {
    if (this.rootNode.current) {
      this.setState({ shouldRender: true });
    }

    window.addEventListener("resize", this.onResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
  }

  render() {
    const { relations, visible, highlighted } = this.props;
    const hasHighlight = !!highlighted;

    const style = {
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      position: "absolute",
      pointerEvents: "none",
      zIndex: 100,
    };

    return (
      <svg ref={this.rootNode} xmlns="http://www.w3.org/2000/svg" style={style}>
        {this.state.shouldRender && this.renderRelations(relations, visible, hasHighlight, highlighted)}
      </svg>
    );
  }

  renderRelations(relations, visible, hasHighlight, highlightedRelation) {
    return relations.map(relation => {
      const highlighted = highlightedRelation === relation;
      return (
        <RelationItemObserver
          key={relation.id}
          relation={relation}
          rootRef={this.rootNode}
          labels={relation.relations?.selectedValues()}
          dimm={hasHighlight && !highlighted}
          highlight={highlighted}
          visible={highlighted || visible}
          shouldUpdate={this.state.souldRenderConnections}
        />
      );
    });
  }

  onResize = () => {
    this.setState({ souldRenderConnections: Math.random() });
  };
}

const RelationsOverlayObserver = observer(({ store }) => {
  const { relations, showConnections, highlighted } = store;
  return <RelationsOverlay relations={Array.from(relations)} visible={showConnections} highlighted={highlighted} />;
});

export { RelationsOverlayObserver as RelationsOverlay };
