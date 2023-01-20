import { ResultValueBase } from '@result/ResultValueBase';
import { rangeToGlobalOffset } from 'src/utils/selection-tools';
import { NormedRange } from 'xpath-range';

type GlobalOffsets = {
  start: number,
  end: number,
  calculated: boolean,
}

enum LabelTypes {
  hypertextlabels = 'hypertextlabels',
  labels = 'labels',
}

type LabeledResult = {
  [key in LabelTypes]?: string[];
}

type TextResultOutput = {
  start: string,
  end: string,
  startOffset: number,
  endOffset: number,
  globalOffsets: GlobalOffsets,
  text: string,
} & LabeledResult

export class TextResult extends ResultValueBase<TextResultOutput> {
  private xpathRange!: NormedRange;
  private range!: Range;
  private text!: string;
  private startOffset!: number;
  private endOffset!: number;
  private globalOffsets: GlobalOffsets = {
    start: 0,
    end: 0,
    calculated: false,
  };

  configure({
    xpathRange,
    range,
    text,
  }: {
    xpathRange: NormedRange,
    range: Range,
    text: string,
  }) {
    this.xpathRange = xpathRange;
    this.range = range;
    this.text = text;
  }

  updateGlobalOffsets(root: HTMLElement | undefined) {
    if (!root) return;

    const [soff, eoff] = rangeToGlobalOffset(this.range, root);

    this.globalOffsets.start = soff;
    this.globalOffsets.end = eoff;
  }

  updateSelfOffsets(startOffset: number, endOffset: number) {
    this.startOffset = startOffset;
    this.endOffset = endOffset;
  }

  toJSON(): TextResultOutput {
    return {
      start: this.xpathRange.start,
      end: this.xpathRange.end,
      startOffset: this.globalOffsets.start ?? this.xpathRange.startOffset,
      endOffset: this.globalOffsets.end ?? this.xpathRange.endOffset,
      globalOffsets: this.globalOffsets,
      text: this.text,
      hypertextlabels: ['hypertextlabels'],
    };
  }
}
