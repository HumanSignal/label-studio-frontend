import { AudioDecoderWorker, getAudioDecoderWorker } from 'audio-file-decoder';
// eslint-disable-next-line
// @ts-ignore
import DecodeAudioWasm from 'audio-file-decoder/decode-audio.wasm';
import { Events } from '../Common/Events';
import { clamp, info } from '../Common/Utils';

const DURATION_CHUNK_SIZE = 60 * 30; // 30 minutes

export const DEFAULT_FREQUENCY_HZ = 44100;

interface AudioDecoderEvents {
  progress: (chunk: number, total: number) => void;
}

export class AudioDecoder extends Events<AudioDecoderEvents> {
  chunks?: Float32Array[];
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
      this._dataLength = this.chunks?.reduce((a, b) => a + b.length, 0) ?? 0;
    }
    return this._dataLength;
  }

  get dataSize() {
    if (this.chunks && !this._dataSize) {
      this._dataSize = this.chunks?.reduce((a, b) => a + b.byteLength, 0) ?? 0;
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
   * Total number of chunks to decode
   */
  getTotalChunks(duration: number) {
    return Math.ceil(duration / DURATION_CHUNK_SIZE);
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
    this.decodingPromise =  new Promise(resolve => (this.decodingResolve = resolve as any));

    try {
      // Set the worker instance and resolve the decoder promise
      this._channelCount = this.worker.channelCount;
      this._sampleRate = this.worker.sampleRate;
      this._duration = this.worker.duration;

      let chunkIndex = 0;
      const totalChunks = this.getTotalChunks(this.worker.duration);
      const chunkIterator = this.chunkDecoder(options);

      const chunks = Array.from({ length: totalChunks }) as Float32Array[];

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
            chunks[chunkIndex] = value;
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

    // The duration start is offset by 1 second in the actual wasm decoder.
    // This is to ensure we correctly capture the entire data set for the waveform,
    // aligning it with the audio data when played back via the media element.
    let durationOffset = -1;

    while (true) {
      yield new Promise((resolve, reject) => {
        if (!this.worker || this.sourceDecodeCancelled) return resolve(null);

        const nextChunkDuration = clamp(totalDuration - durationOffset, 0, DURATION_CHUNK_SIZE);
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
