import { AudioDecoderWorker, getAudioDecoderWorker } from 'audio-file-decoder';
// eslint-disable-next-line
// @ts-ignore
import DecodeAudioWasm from 'audio-file-decoder/decode-audio.wasm';
import { Events } from '../Common/Events';
import { average, bufferAllocator } from '../Common/Utils';


const DURATION_CHUNK_SIZE = 60 * 30; // 30 minutes

interface AudioDecoderEvents {
  progress: (chunk: number, total: number) => void;
}

export class AudioDecoder extends Events<AudioDecoderEvents> {
  static cache: Map<string, AudioDecoder> = new Map();

  private chunks?: Float32Array[];
  // This is assigned in the constructor only when creating a new instance
  // eslint-disable-next-line
  // @ts-ignore
  private buffer: ReturnType<typeof bufferAllocator>;
  private decodeId = 0; // if id=0, decode is not in progress
  private worker: AudioDecoderWorker | undefined;
  private decoderResolve?: (() => void);
  private decodingResolve?: (() => void);
  private _dataLength = 0;
  private _channelCount = 1;
  private _sampleRate = 44100;
  private _duration = 0;
  decoderPromise: Promise<void> | undefined;
  decodingPromise: Promise<void> | undefined;

  constructor(private src: string) {
    // Return a cached instance if it exists
    // This allows for multiple instances of the same audio file source to share the same worker
    // and decoded data results
    if (AudioDecoder.cache.has(src)) {
      return AudioDecoder.cache.get(src) as AudioDecoder;
    }

    super();

    // only allow one cached decoder at a time to prevent memory leaks
    // and limit the memory usage of the browser
    AudioDecoder.cache.clear();
    this.buffer = bufferAllocator();
    AudioDecoder.cache.set(this.src, this);
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
      this._dataLength = this.chunks?.reduce((a, b) => a + b.byteLength, 0) ?? 0;
    }
    return this._dataLength;
  }

  get sourceDecoded() {
    return this.chunks !== undefined;
  }

  get sourceDecodeCancelled() {
    return this.decodeId === 0;
  }

  /**
   * Cancel the decoding process.
   * This will stop the generator and dispose the worker.
   */
  cancel() {
    this.decodeId = 0;
    this.decoderResolve?.();
    this.decoderResolve = undefined;
    this.decodingResolve?.();
    this.decodingResolve = undefined;
    this.disposeWorker();
  }

  destroy() {
    // Since this is a singleton, we don't want to destroy the instance but clear all active
    // subscriptions and cancel any pending decoding work
    super.removeAllListeners();
    this.cancel();
    this.disposeWorker();
    // TODO: dispose chunks and buffer based on a ttl so change between same sources
    // doesn't cause a memory leak but also doesn't require reprocessing and downloading the same file again
  
    // delete this.chunks;
    // AudioDecoder.cache.delete(this.src);
  }

  /**
   * Total number of chunks to decode
   */
  getTotalChunks(duration: number) {
    return Math.ceil(duration / DURATION_CHUNK_SIZE);
  }

  /**
   * Decode the audio file in chunks to ensure the UI remains responsive.
   */
  async decode(arraybuffer: ArrayBuffer, options?: {multiChannel?: boolean}): Promise<void> {
    // decoding is already in progress for this source, so wait for it to finish
    if (this.decodingPromise) return this.decodingPromise;
    // If the worker has cached data, we can skip the decode step
    if (this.sourceDecoded) return Promise.resolve();

    // clear any previous decoding state
    this.cancel();
    this.decodeId = Date.now();
    this.decodingPromise = new Promise(resolve => (this.decodingResolve = (resolve as any)));
    this.decoderPromise = new Promise(resolve => (this.decoderResolve = (resolve as any)));

    await getAudioDecoderWorker(DecodeAudioWasm, arraybuffer).then(async (worker) => {
      if (this.sourceDecodeCancelled) return;

      // Set the worker instance and resolve the decoder promise
      this.worker = worker;
      this._channelCount = this.worker.channelCount;
      this._sampleRate = this.worker.sampleRate;
      this._duration = this.worker.duration;
      this.decoderResolve?.();

      let chunkIndex = 0;
      const totalChunks = this.getTotalChunks(this.worker.duration);
      const chunkIterator = this.chunkDecoder(options);
      const sampleSize = Math.floor(this.worker.sampleRate * 0.01);

      this.chunks = Array.from({ length: totalChunks }) as Float32Array[];

      this.invoke('progress', [0, totalChunks]);

      // Work through the chunks of the file in a generator until done.
      // Allow this to be interrupted at any time safely.
      while (chunkIndex < totalChunks) {
        if (this.sourceDecodeCancelled) return null;

        const result = chunkIterator.next();

        if (!result.done) {
          const value = await result.value;

          if (this.sourceDecodeCancelled) return null;

          if (value) {
            // Get sample size for 0.01 seconds
            const length = value.length;
            const buffer = this.buffer.allocate(length);

            for (let i = 0; i < length; i += sampleSize) {
              const slice = value.slice(i, i + sampleSize);
              const avg = average(slice);

              slice.fill(avg);
              buffer.set(slice, i);
            }
            this.chunks[chunkIndex] = buffer;
          }

          this.invoke('progress', [chunkIndex + 1, totalChunks]);

          chunkIndex++;
        }

        if (result.done) {
          break;
        }
      }

      return this.chunks;
    }).finally(() => {
      this.decodingResolve?.();
      this.disposeWorker();
    });
  }

  private disposeWorker() {
    if (this.worker) {
      this.worker.dispose();
      this.worker = undefined;
    }
  }

  /**
   * Decode in chunks of up to 600 seconds until the whole file is decoded.
   * Do the work in a Web Worker to avoid blocking the UI.
   * Do the work in a interruptible generator to avoid blocking the worker.
   */
  private *chunkDecoder(options?: {multiChannel?: boolean}): Generator<Promise<Float32Array|null>|null> {
    if (!this.worker || this.sourceDecodeCancelled) return null;

    const totalDuration = this.worker.duration;

    let durationOffset = 0;

    while (true) {
      yield new Promise((resolve) => {
        if (!this.worker || this.sourceDecodeCancelled) return resolve(null);

        const nextChunkDuration = Math.min(DURATION_CHUNK_SIZE, Math.max(0, totalDuration - durationOffset));
        const currentOffset = durationOffset;

        durationOffset += nextChunkDuration;

        this.worker.decodeAudioData(currentOffset, nextChunkDuration, {
          multiChannel: options?.multiChannel ?? false,
          ...options,
        }).then((chunk) => {
          resolve(chunk);
          if (!chunk) return; 
        });
      });
    }
  }
}
