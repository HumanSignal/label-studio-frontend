import { TimelineRegionKeyframe } from "../../Types";

export const visualizeLifespans = (keyframes: TimelineRegionKeyframe[], step: number) => {
  if (keyframes.length === 0) return [];

  const lines = [];
  const start = keyframes[0].frame - 1;

  for(let i = 0, l = keyframes.length; i < l; i++) {
    const lastLine = lines[lines.length - 1];
    const point = keyframes[i];
    const prevPoint = keyframes[i-1];
    const offset = (point.frame - start - 1) * step;

    if (!lastLine || !lastLine?.enabled) {
      lines.push({
        offset,
        width: 0,
        length: 0,
        enabled: point.enabled,
        start: point.frame,
        points: [point],
      });
    } else if (prevPoint?.enabled) {
      lastLine.width = (point.frame - lastLine.points[0].frame) * step;
      lastLine.length = point.frame - lastLine.start;
      lastLine.enabled = point.enabled;
      lastLine.points.push(point);
    }
  }

  return lines;
};

export const findClosestKeypoint = (frames: number[], position: number, direction: -1 | 1) => {
  const targetFrames = frames.filter(f => direction === -1 ? f < position : f > position);

  return targetFrames[direction === -1 ? targetFrames.length - 1 : 0] ?? position;
};
