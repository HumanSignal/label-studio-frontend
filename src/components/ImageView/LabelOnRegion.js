import React, { Fragment, useCallback, useMemo, useState } from "react";
import { Rect, Group, Text, Label, Tag, Path } from "react-konva";
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

const NON_ADJACENT_CORNER_RADIUS = 4;
const ADJACENT_CORNER_RADIUS = [4, 4, 0, 0];
const TAG_PATH = "M13.47,2.52c-0.27-0.27-0.71-0.27-1.59-0.27h-0.64c-1.51,0-2.26,0-2.95,0.29C7.61,2.82,7.07,3.35,6,4.43L3.65,6.78c-0.93,0.93-1.4,1.4-1.4,1.97c0,0.58,0.46,1.04,1.39,1.97l1.63,1.63c0.93,0.93,1.39,1.39,1.97,1.39s1.04-0.46,1.97-1.39L11.57,10c1.07-1.07,1.61-1.61,1.89-2.29c0.28-0.68,0.28-1.44,0.28-2.96V4.11C13.74,3.23,13.74,2.8,13.47,2.52z M10.5,6.9c-0.77,0-1.4-0.63-1.4-1.4s0.63-1.39,1.4-1.39s1.39,0.63,1.39,1.4S11.27,6.9,10.5,6.9z";
const OCR_PATH = "M13,1v2H6C4.11,3,3.17,3,2.59,3.59C2,4.17,2,5.11,2,7v2c0,1.89,0,2.83,0.59,3.41C3.17,13,4.11,13,6,13h7v2h1V1H13z M6,9.5C5.17,9.5,4.5,8.83,4.5,8S5.17,6.5,6,6.5S7.5,7.17,7.5,8S6.83,9.5,6,9.5z M11,9.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S11.83,9.5,11,9.5z";


const LabelOnBbox = ({ x, y, text, score, showLabels, showScore, rotation=0, zoomScale = 1, color, maxWidth, onClickLabel, onMouseEnterLabel, onMouseLeaveLabel, adjacent = false, isTexting = false }) => {
  const fontSize = 13;
  const height = 20;
  const ss = showScore && score;
  const scale = 1 / zoomScale;
  const [textEl, setTextEl] = useState();
  const paddingLeft = 20;
  const paddingRight = 5;
  const scoreSpace = ss ? 34 : 0;
  const horizontalPaddings = paddingLeft + paddingRight;
  const textMaxWidth = Math.max(0,maxWidth * zoomScale - horizontalPaddings - scoreSpace);
  const isSticking = !!textMaxWidth;

  const width = useMemo(() => {
    if (!showLabels || !textEl || !maxWidth) return null;
    const currentTextWidth = (text ? textEl.measureSize(text).width : 0) ;

    if (currentTextWidth > textMaxWidth) {
      return textMaxWidth;
    } else {
      return null;
    }
  }, [textEl, text, maxWidth, scale]);

  const tagSceneFunc = useCallback((context, shape)=>{
    const cornerRadius = adjacent && isSticking ? ADJACENT_CORNER_RADIUS : NON_ADJACENT_CORNER_RADIUS;
    const width = maxWidth ? Math.min(shape.width() + horizontalPaddings, isSticking ? maxWidth * zoomScale : paddingLeft) : shape.width() + horizontalPaddings;
    const height = shape.height();

    context.beginPath();
    if (!cornerRadius) {
      context.rect(0, 0, width, height);
    }
    else {
      let topLeft = 0;
      let topRight = 0;
      let bottomLeft = 0;
      let bottomRight = 0;

      if (typeof cornerRadius === 'number') {
        topLeft = topRight = bottomLeft = bottomRight = Math.min(cornerRadius, width / 2, height / 2);
      }
      else {
        topLeft = Math.min(cornerRadius[0], width / 2, height / 2);
        topRight = Math.min(cornerRadius[1], width / 2, height / 2);
        bottomRight = Math.min(cornerRadius[2], width / 2, height / 2);
        bottomLeft = Math.min(cornerRadius[3], width / 2, height / 2);
      }
      context.moveTo(topLeft, 0);
      context.lineTo(width - topRight, 0);
      context.arc(width - topRight, topRight, topRight, (Math.PI * 3) / 2, 0, false);
      context.lineTo(width, height - bottomRight);
      context.arc(width - bottomRight, height - bottomRight, bottomRight, 0, Math.PI / 2, false);
      context.lineTo(bottomLeft, height);
      context.arc(bottomLeft, height - bottomLeft, bottomLeft, Math.PI / 2, Math.PI, false);
      context.lineTo(0, topLeft);
      context.arc(topLeft, topLeft, topLeft, Math.PI, (Math.PI * 3) / 2, false);
    }
    context.closePath();
    context.fillStrokeShape(shape);
  }, [adjacent, isSticking, maxWidth]);

  return (
    <Group strokeScaleEnabled={false} x={x} y={y} rotation={rotation}>
      {ss && (

        <Label y={-height * scale} scaleX={scale} scaleY={scale} onClick={() => {return false;}}>
          <Tag fill={Utils.Colors.getScaleGradient(score)} cornerRadius={2}/>
          <Text
            text={score.toFixed(2)}
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
            fontSize={fontSize}
            fill="white" padding={2}/>
        </Label>
      )}
      {showLabels && (
        <>
          <Label x={paddingLeft * scale + scoreSpace * scale} y={-height * scale} scaleX={scale} scaleY={scale}
            onClick={onClickLabel}
            onMouseEnter={onClickLabel ? onMouseEnterLabel : null}
            onMouseLeave={onClickLabel ? onMouseLeaveLabel : null}
          >
            <Tag fill={color} cornerRadius={4} sceneFunc={tagSceneFunc} offsetX={paddingLeft}/>
            <Text ref={setTextEl} text={text}
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
              fontSize={fontSize}
              lineHeight={1 / fontSize * height}
              height={height}
              width={width}
              wrap="none"
              ellipsis="true"
              fill={Constants.SHOW_LABEL_FILL}
              padding={0}/>
          </Label>
          <Path
            x={2 * scale + scoreSpace * scale}
            y={2 * scale - height * scale}
            scaleX={scale} scaleY={scale}
            fill={Constants.SHOW_LABEL_FILL}
            data={isTexting ? OCR_PATH : TAG_PATH}
          />
        </>
      )}
    </Group>
  );
};

const LabelOnEllipse = observer(({ item, color, strokewidth }) => {
  const isLabeling = !!item.labeling;
  const isTexting = !!item.texting;
  const labelText = item.getLabelText(",");

  if (!isLabeling && !isTexting) return null;
  const zoomScale = item.parent.zoomScale || 1;

  return (
    <LabelOnBbox
      x={item.x - item.radiusX - strokewidth / 2 / zoomScale}
      y={item.y - item.radiusY - strokewidth / 2 / zoomScale}
      isTexting={isTexting}
      text={labelText}
      score={item.score}
      showLabels={getRoot(item).settings.showLabels}
      showScore={getRoot(item).settings.showLabels}
      zoomScale={item.parent.zoomScale}
      color={color}
      onClickLabel={item.onClickLabel}
    />
  );
});

const LabelOnRect = observer(({ item, color, strokewidth }) => {
  const isLabeling = !!item.labeling;
  const isTexting = !!item.texting;
  const labelText = item.getLabelText(",");

  if (!isLabeling && !isTexting) return null;
  const zoomScale = item.parent.zoomScale || 1;

  return (
    <LabelOnBbox
      x={item.x - strokewidth / 2 / zoomScale}
      y={item.y - strokewidth / 2 / zoomScale}
      isTexting={isTexting}
      text={labelText}
      score={item.score}
      showLabels={getRoot(item).settings.showLabels}
      showScore={getRoot(item).settings.showLabels}
      zoomScale={item.parent.zoomScale}
      rotation={item.rotation}
      color={color}
      maxWidth={item.width + strokewidth}
      adjacent
      onClickLabel={item.onClickLabel}
    />
  );
});

const LabelOnPolygon = observer(({ item, color }) => {
  const isLabeling = !!item.labeling;
  const isTexting = !!item.texting;
  const labelText = item.getLabelText(",");

  if (!isLabeling && !isTexting) return null;

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
          stroke={item.style?.strokecolor}
          strokeWidth={1}
          strokeScaleEnabled={false}
          shadowBlur={0}
        />
      )}
      <LabelOnBbox
        x={bbox[0][0]}
        y={bbox[1][0] + 2 / item.parent.zoomScale}
        isTexting={isTexting}
        text={labelText}
        score={item.score}
        showLabels={settings && settings.showLabels}
        showScore={settings && settings.showScore}
        zoomScale={item.parent.zoomScale}
        color={color}
        onClickLabel={item.onClickLabel}
      />
    </Fragment>
  );
});

const LabelOnMask = observer(({ item, color }) => {
  const settings = getRoot(item).settings;

  if (settings && !settings.showLabels && !settings.showScore) return null;

  const isLabeling = !!item.labeling;
  const isTexting = !!item.texting;
  const labelText = item.getLabelText(",");

  if (!isLabeling && !isTexting) return null;
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
        stroke={item.style?.strokecolor}
        strokeWidth={1}
        strokeScaleEnabled={false}
        shadowBlur={0}
      />
      <LabelOnBbox
        x={bbox[0][0]}
        y={bbox[1][0] + 2 / item.parent.zoomScale}
        isTexting={isTexting}
        text={labelText}
        score={item.score}
        showLabels={getRoot(item).settings.showLabels}
        showScore={settings && settings.showScore}
        zoomScale={item.parent.zoomScale}
        color={color}
        onClickLabel={item.onClickLabel}
      />
    </Group>
  );
});

const LabelOnKP = observer(({ item, color }) => {
  const isLabeling = !!item.labeling;
  const isTexting = !!item.texting;
  const labelText = item.getLabelText(",");

  if (!isLabeling && !isTexting) return null;

  return (
    <LabelOnBbox
      // keypoints' width scaled back to stay always small, so scale it here too
      x={item.x + (item.width + 2) / item.parent.zoomScale}
      y={item.y + (item.width + 2) / item.parent.zoomScale}
      isTexting={isTexting}
      text={labelText}
      score={item.score}
      showLabels={getRoot(item).settings.showLabels}
      showScore={getRoot(item).settings.showScore}
      zoomScale={item.parent.zoomScale}
      color={color}
      onClickLabel={item.onClickLabel}
    />
  );
});

export { LabelOnBbox, LabelOnPolygon, LabelOnRect, LabelOnEllipse, LabelOnKP, LabelOnMask };
