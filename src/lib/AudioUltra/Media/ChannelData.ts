import { Destructable } from '../Common/Destructable';
import { ComputeWorker } from '../Common/Worker';
import { Visualizer } from '../Visual/Visualizer';
import { Waveform } from '../Waveform';
import { reduceNoise } from './ChannelDataWorker';

interface ChannelDataOptions {
  data: Float32Array;
  visualizer: Visualizer;
  waveform: Waveform;
  getChunksSize: () => number;
}

type ChunkComputerOutput = Float32Array[][];

const worker = new Worker(new URL('./ChannelDataWorker.ts', import.meta.url));
const chunkComputer = new ComputeWorker(worker);

export class ChannelData extends Destructable {
  private options: ChannelDataOptions;

  // Audio data
  data!: Float32Array;

  // Chunks of data to render
  // chunks: ChunksList[] = [];

  views: ChunkComputerOutput = [];

  private stored = false;

  normalized!: Float32Array[];

  regionSize = 0;

  private get backgroundCompute() {
    return this.options.waveform.params.experimental?.backgroundCompute === true;
  }

  private get denoize() {
    return this.options.waveform.params.experimental?.denoize === true;
  }

  get normalizedChunkSize() {
    return this.normalized?.[0]?.length;
  }

  constructor(options: ChannelDataOptions) {
    super();
    this.options = options;
    this.data = options.data;
  }

  destroy() {
    chunkComputer.destroy();
    this.data = new Float32Array();
    this.normalized = [];
    this.views = [];
    super.destroy();
  }

  async recalculate(){
    await this.precomputeData();
  }

  private async precomputeData() {
    if (this.stored) return;

    if (this.backgroundCompute) {
      await chunkComputer.precompute({
        data: this.data,
        sampleRate: this.options.waveform.sampleRate,
        denoize: this.denoize,
      });
    } else {
      this.data = reduceNoise({
        data: this.data,
        sampleRate: this.options.waveform.sampleRate,
        denoize: this.denoize,
      });
    }

    this.stored = true;
  }
}
