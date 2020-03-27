import React, { Fragment } from "react";
import { Rect, Group, Text, Label, Tag } from "react-konva";

function polytobbox(coords) {
  var lats = [];
  var lngs = [];

  for (var i = 0; i < coords[0].length; i++) {
    lats.push(coords[0][i][1]);
    lngs.push(coords[0][i][0]);
    // following not needed to calc bbox, just so you can see the points
    // L.marker([coords[0][i][1], coords[0][i][0]]).addTo(map);
  }

  // calc the min and max lng and lat
  var minlat = Math.min.apply(null, lats),
    maxlat = Math.max.apply(null, lats);
  var minlng = Math.min.apply(null, lngs),
    maxlng = Math.max.apply(null, lngs);

  // create a bounding rectangle that can be used in leaflet
  return [
    [minlat, minlng],
    [maxlat, maxlng],
  ];
}

const LabelInBbox = ({ item }) => {};

const LabelOnRegion = ({ item }) => {
  if (item.states && item.states[0].holdsState) {
    const image = item.parent;
    return (
      <Label x={item.x + item.strokeWidth + 2} y={item.y + item.strokeWidth + 2}>
        <Tag fill="black" />
        <Text text={item.states[0].getSelectedNames()} fontFamily="Calibri" fill="white" />
      </Label>
    );
  } else {
    return null;
  }
};

export { LabelOnRegion };
