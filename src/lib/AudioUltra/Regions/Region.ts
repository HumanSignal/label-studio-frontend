import { Waveform } from "..";
import { rgba } from "../Common/Color";
import { Visualizer } from "../Visual/Visualizer";
import { Regions } from "./Regions";
import { Segment, SegmentGlobalEvents, SegmentOptions } from "./Segment";

export interface RegionGlobalEvents extends SegmentGlobalEvents {
  regionCreated: (region: Region|Segment) => void;
  regionUpdated: (region: Region|Segment) => void;
  regionUpdatedEnd: (region: Region|Segment) => void;
  regionRemoved: (region: Region|Segment) => void;
}

export interface RegionOptions extends SegmentOptions {
  labels?: string[]; 
  color?: string;
}

export class Region extends Segment {

  private labels: string[] = [];

  constructor(options: RegionOptions, waveform: Waveform, visualizer: Visualizer, controller: Regions) {
    super(options, waveform, visualizer, controller);
    this.labels = options.labels ?? this.labels;
    this.color = options.color ? rgba(options.color) : this.color;
    this.handleColor = this.color.clone().darken(0.6);
  }

  get isRegion() {
    return true;
  }

  toJSON() {
    return {
      start: this.start,
      end: this.end,
      color: this.color.toString(),
      labels: this.labels,
      layerName: this.layerName,
      id: this.id,
    };
  }
}
