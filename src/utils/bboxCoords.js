import { minMax } from './utilities';

export function rotateBboxCoords(bboxCoords, rotation, pivot = { x: bboxCoords.left, y: bboxCoords.top }) {
  if (!bboxCoords) return bboxCoords;
  const a = rotation * Math.PI / 180, cosA = Math.cos(a), sinA = Math.sin(a);

  const points = [
    {
      x: bboxCoords.left - pivot.x,
      y: bboxCoords.top - pivot.y,
    },
    {
      x: bboxCoords.right - pivot.x,
      y: bboxCoords.top - pivot.y,
    },
    {
      x: bboxCoords.left - pivot.x,
      y: bboxCoords.bottom - pivot.y,
    },
    {
      x: bboxCoords.right - pivot.x,
      y: bboxCoords.bottom - pivot.y,
    },
  ].map(p => ({
    x: p.x * cosA - p.y * sinA,
    y: p.x * sinA + p.y * cosA,
  }));
  const [left, right] = minMax(points.map(p=>p.x));
  const [top, bottom] = minMax(points.map(p=>p.y));

  return {
    left: left + pivot.x,
    right: right + pivot.x,
    top: top + pivot.y,
    bottom: bottom + pivot.y,
  };
}