import { TimelineRegionKeyframe } from "../../Types";

export const visualizeKeyframes = (keyframes: TimelineRegionKeyframe[], step: number) => {
  const lines = [];
  const start = keyframes[0].frame - 1;

  for(let i = 0, l = keyframes.length; i < l; i++) {
    const lastLine = lines[lines.length - 1];
    const point = keyframes[i];
    const prevPoint = keyframes[i-1];
    const offset = (point.frame - start - 1) * step;

    if (!lastLine || prevPoint?.stop) {
      if (lastLine) lastLine.stop = true;

      lines.push({
        offset,
        width: 0,
        length: 0,
        stop: false,
        start: point.frame,
        points: [point],
      });
    } else if (!prevPoint?.stop) {
      lastLine.width = (point.frame - lastLine.points[0].frame) * step;
      lastLine.length += point.frame;
      lastLine.points.push(point);
    }
  }

  return lines;
};
