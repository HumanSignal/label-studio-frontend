import React, { Fragment } from "react";
import { Rect, Group, Text, Label, Tag } from "react-konva";
import { observer } from "mobx-react";
import { getRoot } from "mobx-state-tree";

import Utils from "../../utils";
import Constants from "../../core/Constants";
import { flatten } from "../../utils/utilities";

// @todo rewrite this to update bbox on shape level while adding new point
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

// @todo rewrite this to update bbox on shape level while adding new point
function pointstobbox(points) {
  const len = points.length;
  if (!len)
    return [
      [0, 0],
      [0, 0],
    ];

  var x = [points[0], points[0]];
  var y = [points[1], points[1]];

  for (let i = 2; i < len; i += 2) {
    if (points[i] < x[0]) x[0] = points[i];
    else if (points[i] > x[1]) x[1] = points[i];
    if (points[i + 1] < y[0]) y[0] = points[i + 1];
    else if (points[i + 1] > y[1]) y[1] = points[i + 1];
  }

  return [x, y];
}

const LabelOnBbox = ({ x, y, text, score, showLabels, showScore, zoomScale }) => {
  const ss = showScore && score;
  const scale = 1 / (zoomScale || 1);

  return (
    <Group strokeScaleEnabled={false} opacity={0.8}>
      {ss && (
        <Label x={x} y={y - 20 * scale} scaleX={scale} scaleY={scale}>
          <Tag fill={Utils.Colors.getScaleGradient(score)} cornerRadius={2} />
          <Text text={score.toFixed(2)} fontFamily="Calibri" fill="white" padding={2} />
        </Label>
      )}

      {showLabels && (
        <Label x={ss ? x + 34 * scale : x} y={y - 20 * scale} scaleX={scale} scaleY={scale}>
          <Tag fill={Constants.SHOW_LABEL_BACKGROUND} cornerRadius={2} />
          <Text text={text} fontFamily="Calibri" fill={Constants.SHOW_LABEL_FILL} padding={2} />
        </Label>
      )}
    </Group>
  );
};

const LabelOnEllipse = observer(({ item }) => {
  const s = item.labeling;
  if (!s) return null;

  return (
    <LabelOnBbox
      x={item.x}
      y={item.y}
      text={s.getSelectedString(",")}
      score={item.score}
      showLabels={getRoot(item).settings.showLabels}
      showScore={getRoot(item).settings.showLabels}
      zoomScale={item.parent.zoomScale}
    />
  );
});

const LabelOnRect = observer(({ item }) => {
  const s = item.labeling;
  if (!s) return null;

  return (
    <LabelOnBbox
      x={item.x}
      y={item.y}
      text={s.getSelectedString(",")}
      score={item.score}
      showLabels={getRoot(item).settings.showLabels}
      showScore={getRoot(item).settings.showLabels}
      zoomScale={item.parent.zoomScale}
    />
  );
});

const LabelOnPolygon = observer(({ item }) => {
  const s = item.labeling;
  if (!s) return null;

  const bbox = polytobbox(item.points);
  const settings = getRoot(item).settings;
  return (
    <Fragment>
      {settings && (settings.showLabels || settings.showScore) && (
        <Rect
          x={bbox[0][0]}
          y={bbox[1][0]}
          fillEnabled={false}
          width={bbox[0][1] - bbox[0][0]}
          height={bbox[1][1] - bbox[1][0]}
          stroke={item.strokeColor}
          strokeWidth={1}
          strokeScaleEnabled={false}
          shadowBlur={0}
        />
      )}
      <LabelOnBbox
        x={bbox[0][0]}
        y={bbox[1][0] + 2 / item.parent.zoomScale}
        text={s.getSelectedString(",")}
        score={item.score}
        showLabels={settings && settings.showLabels}
        showScore={settings && settings.showScore}
        zoomScale={item.parent.zoomScale}
      />
    </Fragment>
  );
});

const LabelOnMask = observer(({ item }) => {
  const settings = getRoot(item).settings;
  if (settings && !settings.showLabels && !settings.showScore) return null;

  const s = item.labeling;
  if (!s) return null;
  if (item.touches.length === 0) return null;

  // @todo fix points from [0, 1, 2, 3] to [{x: 0, y: 1}, {x: 2, y: 3}]
  const bbox = pointstobbox(flatten(item.touches.map(t => t.points)));

  return (
    <Group name="region-label">
      <Rect
        x={bbox[0][0]}
        y={bbox[1][0]}
        fillEnabled={false}
        width={bbox[0][1] - bbox[0][0]}
        height={bbox[1][1] - bbox[1][0]}
        stroke={item.strokeColor}
        strokeWidth={1}
        strokeScaleEnabled={false}
        shadowBlur={0}
      />
      <LabelOnBbox
        x={bbox[0][0]}
        y={bbox[1][0] + 2 / item.parent.zoomScale}
        text={s.getSelectedString(",")}
        score={item.score}
        showLabels={getRoot(item).settings.showLabels}
        showScore={settings && settings.showScore}
        zoomScale={item.parent.zoomScale}
      />
    </Group>
  );
});

const LabelOnKP = observer(({ item }) => {
  const s = item.labeling;
  if (!s) return null;

  return (
    <LabelOnBbox
      // keypoints' width scaled back to stay always small, so scale it here too
      x={item.x + (item.width + 2) / item.parent.zoomScale}
      y={item.y + (item.width + 2) / item.parent.zoomScale}
      text={s.getSelectedString(",")}
      score={item.score}
      showLabels={getRoot(item).settings.showLabels}
      showScore={getRoot(item).settings.showScore}
      zoomScale={item.parent.zoomScale}
    />
  );
});

export { LabelOnBbox, LabelOnPolygon, LabelOnRect, LabelOnEllipse, LabelOnKP, LabelOnMask };
