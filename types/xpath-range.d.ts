declare module 'xpath-range' {
  export type NormedRange = {
    start: string,
    startOffset: number,
    end: string,
    endOffset: number,
  }
  export const fromRange: (range: Range, root?: Element | Node) => NormedRange;

  export const toRange: (
    start: NormedRange['start'],
    startOffset: NormedRange['startOffset'],
    end: NormedRange['end'],
    endOffset: NormedRange['endOffset'],
    root?: Element | Node,
  ) => Range;

  export default value;
}
