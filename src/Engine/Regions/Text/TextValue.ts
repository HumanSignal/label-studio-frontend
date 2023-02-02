import { RegionValue, ResultValueType } from 'src/Engine/Regions/RegionValue';
import { NormedRange } from 'xpath-range';

type GlobalOffsets = {
  start: number,
  end: number,
  calculated: boolean,
};

export type TextValueLabels = {
  labels?: string[],
  hypertextlabels?: string[],
};

export type TextValueOutput = {
  start: string,
  end: string,
  startOffset: number,
  endOffset: number,
  globalOffsets: GlobalOffsets,
  text: string,
};

export type TextValueProperties = {
  /** Content extracted from selection */
  text: string,

  /** XPath selector of the beginning of the selection */
  start: string,

  /** XPath selector of the end of the selection */
  end: string,

  /** Starting character index of the selection */
  startOffset: number,

  /** Ending character index of the selection */
  endOffset: number,

  /** Offsets of the selection relative to the root elemenet */
  globalOffsets?: GlobalOffsets,
};

export class TextValue extends RegionValue<TextValueProperties & TextValueLabels> {
  static type = ResultValueType.text;

  get isText() {
    return (this.constructor as typeof TextValue).type === ResultValueType.text;
  }

  // get background() {
  //  const controller = this.controllers;
  // }

  render() {}

  updateXPathRange(xpathRange: NormedRange) {
    this.properties.start = xpathRange.start;
    this.properties.end = xpathRange.end;
    this.properties.startOffset = xpathRange.startOffset;
    this.properties.endOffset = xpathRange.endOffset;
  }

  updateGlobalOffsets(soff: number, eoff: number) {
    this.properties.globalOffsets = {
      start: soff,
      end: eoff,
      calculated: true,
    };
  }

  updateSelfOffsets(startOffset: number, endOffset: number) {
    this.properties.startOffset = startOffset;
    this.properties.endOffset = endOffset;
  }

  updateTextOffsets(startOffset: number, endOffset: number) {
    this.properties.startOffset = startOffset;
    this.properties.endOffset = endOffset;
  }

  exportResult(): TextValueOutput {
    const globalOffsets = this.properties.globalOffsets;

    return {
      globalOffsets: globalOffsets ?? {
        start: this.properties.startOffset,
        end: this.properties.endOffset,
        calculated: false,
      },
      start: this.properties.start,
      end: this.properties.end,
      startOffset: globalOffsets?.start ?? this.properties.startOffset,
      endOffset: globalOffsets?.end ?? this.properties.endOffset,
      text: this.properties.text,
    };
  }

  export(): TextValueOutput & TextValueLabels {
    return {
      ...this.exportResult(),
      labels: this.properties.labels!,
    };
  }
}
