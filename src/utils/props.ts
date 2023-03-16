/**
 * project any angle onto the interval (-180;180]
 */
export function normalizeAngle(x:number) {
  while(x > 0) x -= 360;
  return (x - 180) % 360 + 180;
}

type SequenceItem = {
  frame: number,
  [k: string]: any,
}

/**
 * interpolate prop between two sequence items
 */
export const interpolateProp = (start: SequenceItem, end: SequenceItem, frame:number, prop:string) => {
  // @todo edge cases
  const r = (frame - start.frame) / (end.frame - start.frame);

  if (prop === 'rotation') {
    return normalizeAngle(start[prop] + normalizeAngle(end[prop] - start[prop]) * r);
  }
  return start[prop] + (end[prop] - start[prop]) * r;
};