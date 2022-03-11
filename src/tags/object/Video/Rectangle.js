import React, { useCallback, useMemo, useState } from "react";
import { Group, Label, Path, Rect, Tag, Text } from "react-konva";
import { observer } from "mobx-react";
import Utils from "../../../utils";
import Constants from "../../../core/Constants";
import { useRegionStyles } from "../../../hooks/useRegionColor";

const NON_ADJACENT_CORNER_RADIUS = 4;
const ADJACENT_CORNER_RADIUS = [4, 4, 0, 0];
const TAG_PATH =
  "M13.47,2.52c-0.27-0.27-0.71-0.27-1.59-0.27h-0.64c-1.51,0-2.26,0-2.95,0.29C7.61,2.82,7.07,3.35,6,4.43L3.65,6.78c-0.93,0.93-1.4,1.4-1.4,1.97c0,0.58,0.46,1.04,1.39,1.97l1.63,1.63c0.93,0.93,1.39,1.39,1.97,1.39s1.04-0.46,1.97-1.39L11.57,10c1.07-1.07,1.61-1.61,1.89-2.29c0.28-0.68,0.28-1.44,0.28-2.96V4.11C13.74,3.23,13.74,2.8,13.47,2.52z M10.5,6.9c-0.77,0-1.4-0.63-1.4-1.4s0.63-1.39,1.4-1.39s1.39,0.63,1.39,1.4S11.27,6.9,10.5,6.9z";
const OCR_PATH =
  "M13,1v2H6C4.11,3,3.17,3,2.59,3.59C2,4.17,2,5.11,2,7v2c0,1.89,0,2.83,0.59,3.41C3.17,13,4.11,13,6,13h7v2h1V1H13z M6,9.5C5.17,9.5,4.5,8.83,4.5,8S5.17,6.5,6,6.5S7.5,7.17,7.5,8S6.83,9.5,6,9.5z M11,9.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S11.83,9.5,11,9.5z";

const getNodeAbsoluteDimensions = (node, workingArea) => {
  const { realWidth: width, realHeight: height } = workingArea;

  return {
    x: node.x() / width * 100,
    y: node.y() / height * 100,
    width: node.width() / width * 100,
    height: node.height() / height * 100,
    rotation: node.rotation(),
  };
};

const RectangleLabel = ({ x, y, text, showLabels, scale, maxWidth, textMaxWidth, scoreSpace, onClickLabel, isTexting, isSticking, style }) => {
  const [textEl, setTextEl] = useState();
  const fontSize = 20;
  const height = 30;
  const paddingLeft = 20;
  const paddingRight = 5;
  const horizontalPaddings = paddingLeft + paddingRight;

  const width = useMemo(() => {
    if (!showLabels || !textEl || !maxWidth) return null;
    const currentTextWidth = text ? textEl.measureSize(text).width : 0;

    if (currentTextWidth > textMaxWidth) {
      return textMaxWidth;
    } else {
      return null;
    }
  }, [textEl, text, maxWidth, scale]);

  const tagSceneFunc = useCallback(
    (context, shape) => {
      const cornerRadius = isSticking ? ADJACENT_CORNER_RADIUS : NON_ADJACENT_CORNER_RADIUS;
      const width = maxWidth
        ? Math.min(shape.width() + horizontalPaddings, isSticking ? maxWidth : paddingLeft)
        : shape.width() + horizontalPaddings;
      const height = shape.height();

      context.beginPath();
      if (!cornerRadius) {
        context.rect(0, 0, width, height);
      } else {
        let topLeft = 0;
        let topRight = 0;
        let bottomLeft = 0;
        let bottomRight = 0;

        if (typeof cornerRadius === "number") {
          topLeft = topRight = bottomLeft = bottomRight = Math.min(cornerRadius, width / 2, height / 2);
        } else {
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
    },
    [isSticking, maxWidth],
  );

  return showLabels ? (
    <>
      <Label
        x={x + paddingLeft * scale + scoreSpace * scale}
        y={y - height}
        scaleX={scale}
        scaleY={scale}
        onClick={onClickLabel}
      >
        <Tag fill={style.fillColor} cornerRadius={4} sceneFunc={tagSceneFunc} offsetX={paddingLeft} />
        <Text
          ref={setTextEl}
          text={text}
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
          fontSize={fontSize}
          lineHeight={(1 / fontSize) * height}
          height={height}
          width={width}
          wrap="none"
          ellipsis="true"
          fill={Constants.SHOW_LABEL_FILL}
          padding={0}
        />
      </Label>
      <Path
        x={x + 2 * scale + scoreSpace}
        y={y + 2 * scale - 25}
        scaleX={scale}
        scaleY={scale}
        fill={Constants.SHOW_LABEL_FILL}
        data={isTexting ? OCR_PATH : TAG_PATH}
      />
    </>
  ) : null;
};

const RectanglePure = ({ reg, frame, workingArea, ...rest }) => {
  const box = reg.getShape(frame);
  const style = useRegionStyles(reg, { includeFill: true });

  if (!box) return null;

  const { realWidth: waWidth, realHeight: waHeight } = workingArea;
  const text = reg.getLabelText(",");
  const showLabels = reg.store.settings.showLabels;
  const { score } = reg;
  const fontSize = 20;
  const height = 30;
  const ss = showLabels && score;
  const scoreSpace = ss ? 34 : 0;
  const scale = 1;
  const paddingLeft = 20;
  const paddingRight = 5;
  const horizontalPaddings = paddingLeft + paddingRight;
  const maxWidth = box.width * waWidth / 100;
  const textMaxWidth = Math.max(0, maxWidth - horizontalPaddings - scoreSpace);
  const isSticking = !!textMaxWidth;
  const isTexting = !!reg.texting;

  const groupBox = {
    strokeScaleEnabled: false,
  };

  const newBox = {
    x: (box.x * waWidth) / 100,
    y: (box.y * waHeight) / 100,
    width: (box.width * waWidth) / 100,
    height: (box.height * waHeight) / 100,
    rotation: box.rotation,
  };

  const onClickLabel = reg.onClickRegion;

  return reg.isInLifespan(frame) ? (
    <Group {...groupBox}>
      {ss && (
        <Label
          x={newBox.x}
          y={newBox.y - height}
          scaleX={scale}
          scaleY={scale}
          onClick={() => {
            return false;
          }}
        >
          <Tag fill={Utils.Colors.getScaleGradient(score)} cornerRadius={2} />
          <Text
            text={score.toFixed(2)}
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
            fontSize={fontSize}
            fill="white"
            padding={2}
          />
        </Label>
      )}

      <RectangleLabel
        x={newBox.x}
        y={newBox.y}
        text={text}
        showLabels={showLabels}
        maxWidth={maxWidth}
        textMaxWidth={textMaxWidth}
        scoreSpace={scoreSpace}
        scale={scale}
        onClickLabel={onClickLabel}
        isTexting={isTexting}
        isSticking={isSticking}
        style={style}
      />

      <Rect
        {...newBox}
        draggable
        fill={style.fillColor}
        stroke={style.strokeColor}
        strokeScaleEnabled={false}
        opacity={reg.hidden ? 0 : 1}
        onTransformEnd={e => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          // set minimal value
          const w = Math.max(3, node.width() * scaleX);
          const h = Math.max(3, node.height() * scaleY);

          node.scaleX(1);
          node.scaleY(1);
          node.setWidth(w);
          node.setHeight(h);

          reg.updateShape(getNodeAbsoluteDimensions(node, workingArea), frame);
        }}
        onDragEnd={e => {
          const node = e.target;

          reg.updateShape(getNodeAbsoluteDimensions(node, workingArea), frame);
        }}
        {...rest}
      />
    </Group>
  ) : null;
};

export const Rectangle = observer(RectanglePure);
