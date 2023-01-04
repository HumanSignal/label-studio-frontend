import { AudioDecoderWorker, getAudioDecoderWorker } from 'audio-file-decoder';
// eslint-disable-next-line
// @ts-ignore
import DecodeAudioWasm from 'audio-file-decoder/decode-audio.wasm';
import { average, bufferAllocator } from '../Common/Utils';

export interface WaveformAudioOptions {
  src?: string;
  volume?: number;
  muted?: boolean;
  rate?: number;
}

const DURATION_CHUNK_SIZE = 60 * 30; // 30 minutes

const allocator = bufferAllocator();

export class WaveformAudio {
  el?: HTMLAudioElement;
  buffer?: Float32Array[];
  decoderPromise: Promise<void> | undefined;

  // private backed by audio element and getters/setters
  // underscored to keep the public API clean
  private _rate = 1;
  private _volume = 1;
  private _savedVolume = 1;
  private _channelCount = 1;
  private _sampleRate = 44100;
  private _duration = 0;

  private src?: string;
  private decodeId = 0; // if id=0, decode is not in progress
  private decoder: AudioDecoderWorker | undefined;
  private decoderResolve?: (() => void);

  constructor(options: WaveformAudioOptions) {
    this._rate = options.rate ?? this._rate;
    this._savedVolume = options.volume ?? this._volume;
    this._volume = options.muted ? 0 : this._savedVolume;
    this.src = options.src;

    this.createMediaElement();
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

  get volume() {
    return this._volume ?? 1;
  }

  set volume(value: number) {
    if (this.el && this._volume !== value) {
      this.el.volume = this._volume;
    }

    this._volume = value;
  }

  get speed() {
    return this._rate ?? 1;
  }

  set speed(value: number) {
    if (this.el && this._rate !== value) {
      this.el.playbackRate = this._rate;
    }

    this._rate = value;
  }

  get muted() {
    return this.volume === 0;
  }

  connect() {
    if (this.el) this.disconnect();

    this.loadMedia();
  }

  disconnect() {
    this.decodeId = 0;
    this.disposeDecoder();
  }
  
  destroy() {
    this.disconnect();
    delete this.buffer;
    delete this.el;
  }

  mute() {
    this._savedVolume = this.volume;
    this.volume = 0;
  }

  unmute() {
    this.volume = this._savedVolume;
  }

  get dataLength() {
    return this.buffer?.reduce((a, b) => a + b.byteLength, 0) ?? 0;
  }

  get totalDuration() {
    return this.decoder?.duration ?? 0;
  }

  get totalChunks() {
    return Math.ceil(this.totalDuration / DURATION_CHUNK_SIZE);
  }

  private createMediaElement() {
    if (!this.src || this.el) return;

    this.el = document.createElement('audio');
    this.el.preload = 'auto';
  }

  private loadMedia() {
    if (!this.src || !this.el) return;
    
    if (this.el.src !== this.src) {
      this.el.src = this.src;
      this.el.load();
    }
  }

  /**
   * Decode in chunks of up to 600 seconds until the whole file is decoded.
   * Do the work in a Web Worker to avoid blocking the UI.
   * Do the work in a interruptible generator to avoid blocking the worker.
   */
  private *chunkDecoder(options?: {multiChannel?: boolean}): Generator<Promise<Float32Array|null>|null> {
    if (!this.decoder || !this.decodeId) return null;

    const totalDuration = this.totalDuration;

    let durationOffset = 0;

    while (true) {
      yield new Promise((resolve) => {
        if (!this.decoder) return resolve(null);

        const nextChunkDuration = Math.min(DURATION_CHUNK_SIZE, Math.max(0, totalDuration - durationOffset));
        const currentOffset = durationOffset;

        durationOffset += nextChunkDuration;

        this.decoder.decodeAudioData(currentOffset, nextChunkDuration, {
          multiChannel: options?.multiChannel ?? false,
          ...options,
        }).then((chunk) => {
          resolve(chunk);
          if (!chunk) return; 
        });
      });
    }
  }

  cancelDecode() {
    this.decodeId = 0;
    this.decoderResolve?.();
    this.decoderResolve = undefined;
  }

  /**
   * Decode the audio file in chunks to ensure the UI remains responsive.
   */
  async decodeAudioData(arraybuffer: ArrayBuffer, options?: {multiChannel?: boolean}): Promise<void> {
    this.cancelDecode();
    this.decodeId = Date.now();

    this.decoderPromise = new Promise(resolve => (this.decoderResolve = resolve));

    return getAudioDecoderWorker(DecodeAudioWasm, arraybuffer).then(async (decoder) => {
      if (!this.decodeId) return null;

      this.decoder = decoder;

      if (this.decoder) {
        this._channelCount = this.decoder.channelCount;
        this._sampleRate = this.decoder.sampleRate;
        this._duration = this.decoder.duration;
      }

      this.decoderResolve?.();

      let chunkIndex = 0;
      const totalChunks = this.totalChunks;
      const chunkIterator = this.chunkDecoder(options);
      const sampleSize = Math.floor(this.sampleRate * 0.01);
      const chunks = Array.from({ length: totalChunks }) as Float32Array[];

      // Work through the chunks of the file in a generator until done.
      // Allow this to be interrupted at any time safely.
      while (chunkIndex < totalChunks) {
        if (!this.decodeId) return null;

        const result = chunkIterator.next();

        if (!result.done) {
          console.log(`Decoding chunk ${chunkIndex + 1}/${totalChunks}`);

          const value = await result.value;

          if (!this.decodeId) return null;

          if (value) {
            // Get sample size for 0.01 seconds
            const length = value.length;
            const buffer = allocator.allocate(length);

            for (let i = 0; i < length; i += sampleSize) {
              const slice = value.slice(i, i + sampleSize);
              const avg = average(slice);

              slice.fill(avg);
              buffer.set(slice, i);
            }
            chunks[chunkIndex] = buffer;
          }

          chunkIndex++;
        }

        if (result.done) {
          break;
        }
      }

      if (!this.decodeId) return null;

      return chunks;
    }).then(bufferData => {
      if (bufferData) {
        this.buffer = bufferData;
        console.log('bufferData complete', this.dataLength);
      }
    }).finally(() => {
      this.disposeDecoder();
    });
  }

  private disposeDecoder() {
    if (this.decoder) {
      this.decoder.dispose();
      this.decoder = undefined;
    }
  }
}
