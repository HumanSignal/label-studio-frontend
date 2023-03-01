import { AudioDecoderWorker, getAudioDecoderWorker } from '@martel/audio-file-decoder';
// eslint-disable-next-line
// @ts-ignore
import DecodeAudioWasm from '@martel/audio-file-decoder/decode-audio.wasm';
import { Events } from '../Common/Events';
import { clamp, info } from '../Common/Utils';
import { SplitChannel } from './SplitChannel';


const DURATION_CHUNK_SIZE = 60 * 30; // 30 minutes

export const DEFAULT_FREQUENCY_HZ = 44100;

interface AudioDecoderEvents {
  progress: (chunk: number, total: number) => void;
}

export class AudioDecoder extends Events<AudioDecoderEvents> {
  chunks?: Float32Array[][];
  private cancelled = false;
  private decodeId = 0; // if id=0, decode is not in progress
  private worker: AudioDecoderWorker | undefined;
  private _dataLength = 0;
  private _dataSize = 0;
  private _channelCount = 1;
  private _sampleRate = DEFAULT_FREQUENCY_HZ;
  private _duration = 0;
  private decodingResolve?: () => void;
  decodingPromise: Promise<void> | undefined;

  /**
   * Timeout for removal of the decoder from the cache.
   * Any subsequent requests for the same source will renew the decoder and cancel the removal.
   */
  removalId: any = null;

  constructor(private src: string) {
    super();
  }

  get channelCount() {
    return this._channelCount;
  }

  get sampleRate() {
    return this._sampleRate;
  }

  get duration() {
    return this._duration;
  }

  get dataLength() {
    if (this.chunks && !this._dataLength) {
      this._dataLength = (this.chunks?.reduce((a, b) => a + b.reduce((_a, _b) => _a + _b.length, 0), 0) ?? 0) / this._channelCount;
    }
    return this._dataLength;
  }

  get dataSize() {
    if (this.chunks && !this._dataSize) {
      this._dataSize = (this.chunks?.reduce((a, b) => a + b.reduce((_a, _b) => _a + _b.byteLength, 0), 0) ?? 0) / this._channelCount;
    }
    return this._dataSize;
  }

  get sourceDecoded() {
    return this.chunks !== undefined;
  }

  get sourceDecodeCancelled() {
    return this.cancelled && this.decodeId === 0;
  }

  /**
   * Cancel the decoding process.
   * This will stop the generator and dispose the worker.
   */
  cancel() {
    if (!this.cancelled) {
      info('decode:cancelled', this.src);
    }
    this.cancelled = true;
    this.decodeId = 0;

    this.disposeWorker();
  }

  /**
   * Renew the decoder instance to allow reuse of the same decoder with any resultant encoding data.
   */
  renew() {
    this.cancelled = false;
  }

  /**
   * Since this is a singleton, we don't want to destroy the instance but clear all active
   * subscriptions and cancel any pending decoding work
   */
  destroy() {
    super.removeAllListeners();
    this.cancel();
  }

  /**
   * Resolve and remove the shared decoding promise.
   */
  cleanupResolvers() {
    this.decodingResolve?.();
    this.decodingResolve = undefined;
    this.decodingPromise = undefined;
    info('decode:cleanup', this.src);
  }

  /**
   * Total number of chunks to decode.
   *
   * This is used to allocate the number of chunks to decode and to calculate the progress.
   * Influenced by the number of channels and the duration of the audio file, as this will cause errors
   * if the decoder tries to decode and return too much data at once.
   *
   * @example
   * 1hour 44.1kHz 2ch = 1 * 60 * 60 * 44100 * 2 = 158760000 samples -> 4 chunks (39690000 samples/chunk)
   * 1hour 44.1kHz 1ch = 1 * 60 * 60 * 44100 * 1 = 79380000 samples -> 2 chunks (39690000 samples/chunk)
   */
  getTotalChunks() {
    return Math.ceil((this._duration * this._channelCount) / DURATION_CHUNK_SIZE);
  }

  /**
   * Total size in duration seconds per chunk to decode.
   *
   * This is used to work out the number of samples to decode per chunk, as the decoder will
   * return an error if too much data is requested at once. This is influenced by the number of channels.
   */
  getChunkDuration() {
    return DURATION_CHUNK_SIZE / this._channelCount;
  }

  /**
   * Initialize the decoder if it has not already been initialized.
   */
  async init(arraybuffer: ArrayBuffer) {
    if (this.worker) return;
    this.worker = await getAudioDecoderWorker(DecodeAudioWasm, arraybuffer);

    info('decode:worker:ready', this.src);
  }

  /**
   * Decode the audio file in chunks to ensure the UI remains responsive.
   */
  async decode(options?: { multiChannel?: boolean }): Promise<void> {
    // If the worker has cached data we can skip the decode step
    if (this.sourceDecoded) {
      info('decode:cached', this.src);
      return;
    }
    if (this.sourceDecodeCancelled) {
      throw new Error('AudioDecoder: Worker decode cancelled and contains no data, did you call decoder.renew()?');
    }
    // The decoding process is already in progress, so wait for it to finish
    if (this.decodingPromise) {
      info('decode:inprogress', this.src);
      return this.decodingPromise;
    }
    if (!this.worker) throw new Error('AudioDecoder: Worker not initialized, did you call decoder.init()?');

    info('decode:start', this.src);

    // Generate a unique id for this decode operation
    this.decodeId = Date.now();
    // This is a shared promise which will be observed by all instances of the same source
    this.decodingPromise = new Promise(resolve => (this.decodingResolve = resolve as any));

    let splitChannels: SplitChannel | undefined = undefined;

    try {
      // Set the worker instance and resolve the decoder promise
      this._channelCount = options?.multiChannel ? this.worker.channelCount : 1;
      this._sampleRate = this.worker.sampleRate;
      this._duration = this.worker.duration;


      let chunkIndex = 0;
      const totalChunks = this.getTotalChunks();
      const chunkIterator = this.chunkDecoder(options);

      splitChannels = this._channelCount > 1 ? new SplitChannel(this._channelCount) : undefined;

      const chunks = Array.from({ length: this._channelCount }).map(() => Array.from({ length: totalChunks }) as Float32Array[]);

      info('decode:chunk:start', this.src, chunkIndex, totalChunks);

      this.invoke('progress', [0, totalChunks]);

      // Work through the chunks of the file in a generator until done.
      // Allow this to be interrupted at any time safely.
      while (chunkIndex < totalChunks) {
        if (this.sourceDecodeCancelled) return;

        const result = chunkIterator.next();

        if (!result.done) {
          const value = await result.value;

          if (this.sourceDecodeCancelled) return;

          if (value) {
            // Only 1 channel, just copy the data of the chunk directly
            if (this._channelCount === 1) {
              chunks[0][chunkIndex] = value;
            } else {

              if (!splitChannels) throw new Error('AudioDecoder: splitChannels not initialized');

              // Multiple channels, split the data into separate channels within a web worker
              // This is done to avoid blocking the UI thread
              const channels = await splitChannels.split(value);

              if (this.sourceDecodeCancelled) return;

              channels.forEach((channel, index) => {
                chunks[index][chunkIndex] = channel;
              });
            }
          }

          this.invoke('progress', [chunkIndex + 1, totalChunks]);

          info('decode:chunk:process', this.src, chunkIndex, totalChunks);

          chunkIndex++;
        }

        if (result.done) {
          break;
        }
      }

      this.chunks = chunks;

      info('decode:complete', this.src);
    } finally {
      splitChannels?.destroy();
      this.disposeWorker();
    }
  }

  /**
   * Web worker containing the ffmpeg wasm decoder must be disposed of to prevent memory leaks.
   */
  private disposeWorker() {
    if (this.worker) {
      this.worker.dispose();
      this.worker = undefined;
      info('decode:worker:disposed', this.src);
    }

    this.cleanupResolvers();
  }

  /**
   * Decode in chunks of up to 30 minutes until the whole file is decoded.
   * Do the work withing Web Worker to avoid blocking the UI.
   * Allow the work to be interrupted so that the worker can be disposed at any time safely.
   */
  private *chunkDecoder(options?: { multiChannel?: boolean }): Generator<Promise<Float32Array | null> | null> {
    if (!this.worker || this.sourceDecodeCancelled) return null;

    const totalDuration = this.worker.duration;

    let durationOffset = 0;

    while (true) {
      yield new Promise((resolve, reject) => {
        if (!this.worker || this.sourceDecodeCancelled) return resolve(null);

        const nextChunkDuration = clamp(totalDuration - durationOffset, 0, this.getChunkDuration());
        const currentOffset = durationOffset;

        durationOffset += nextChunkDuration;

        this.worker
          .decodeAudioData(currentOffset, nextChunkDuration, {
            multiChannel: options?.multiChannel ?? false,
            ...options,
          })
          .then(resolve)
          .catch(reject);
      });
    }
  }
}
