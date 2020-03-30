import React, { Fragment } from "react";
import { Rect, Group, Text, Label, Tag } from "react-konva";

function polytobbox(points) {
  var lats = [];
  var lngs = [];

  points.forEach(p => {
    lats.push(p.x);
    lngs.push(p.y);
  });

  // calc the min and max lng and lat
  var minlat = Math.min.apply(null, lats),
    maxlat = Math.max.apply(null, lats);
  var minlng = Math.min.apply(null, lngs),
    maxlng = Math.max.apply(null, lngs);

  // create a bounding rectangle that can be used in leaflet
  return [
    [minlat, maxlat],
    [minlng, maxlng],
  ];
}

const LabelOnBbox = ({ x, y, text }) => {
  return (
    <Label x={x} y={y}>
      <Tag fill="black" />
      <Text text={text} fontFamily="Calibri" fill="white" />
    </Label>
  );
};

const LabelOnRect = ({ item }) => {
  if (!item.states || !item.states[0].holdsState) return null;

  return (
    <LabelOnBbox
      x={item.x + item.strokeWidth + 2}
      y={item.y + item.strokeWidth + 2}
      text={item.states[0].getSelectedNames()}
    />
  );
};

const LabelOnPolygon = ({ item }) => {
  if (!item.states || !item.states[0].holdsState) return null;

  const bbox = polytobbox(item.points);
  return (
    <Fragment>
      <Rect
        x={bbox[0][0]}
        y={bbox[1][0]}
        fillEnabled={false}
        width={bbox[0][1] - bbox[0][0]}
        height={bbox[1][1] - bbox[1][0]}
        stroke={item.strokecolor}
        strokeWidth="1"
        strokeScaleEnabled={false}
        shadowBlur={0}
      />
      {/* this is a problem here, it takes states[0] but nothing
       * guarantees that this state is a lable one */}
      <LabelOnBbox x={bbox[0][0] + 2} y={bbox[1][0] + 2} text={item.states[0].getSelectedNames()} />
    </Fragment>
  );
};

const LabelOnMask = ({ item }) => {
  return null;
};

const LabelOnKP = ({ item }) => {
  return null;
};

export { LabelOnBbox, LabelOnPolygon, LabelOnRect };
