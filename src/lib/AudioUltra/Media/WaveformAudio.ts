import { AudioDecoderWorker, getAudioDecoderWorker } from 'audio-file-decoder';
// eslint-disable-next-line
// @ts-ignore
import DecodeAudioWasm from 'audio-file-decoder/decode-audio.wasm';

export interface WaveformAudioOptions {
  volume: number;
  muted: boolean;
  rate: number;
}

export class WaveformAudio {
  context?: AudioContext;
  offline?: OfflineAudioContext;
  analyzer?: AnalyserNode;
  source?: AudioBufferSourceNode;
  gain?: GainNode;
  buffer?: Float32Array[];

  private decodeId = 0; // if id=0, decode is not in progress
  private _rate = 1;
  private _volume = 1;
  private _savedVolume = 1;
  private _channelCount = 1;
  private _sampleRate = 44100;
  private _duration = 0;
  private decoder: AudioDecoderWorker | undefined;

  constructor(options: WaveformAudioOptions) {
    this.context = this.createAudioContext();
    this.offline = this.createOfflineAudioContext();

    this._rate = options.rate;
    this._savedVolume = options.volume;
    this._volume = options.muted ? 0 : options.volume;
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
    this._volume = value;
    if (this.gain) {
      this.gain.gain.value = this._volume;
    }
  }

  get speed() {
    return this._rate ?? 1;
  }

  set speed(value: number) {
    this._rate = value;
    if (this.source) {
      this.source.playbackRate.value = this._rate;
    }
  }

  get muted() {
    return this.volume === 0;
  }

  connect() {
    if (this.source) this.disconnect();
    // if (!this.context || !this.buffer) return;

    // const source = this.context?.createBufferSource();

    // if (!source) return;

    // source.buffer = this.buffer;

    // const analyzer = this.context?.createAnalyser();

    // if (!analyzer) return;

    // analyzer.fftSize = 2048;

    // const gain = this.context?.createGain();

    // if (!gain) return;

    // source.connect(gain);

    // gain.connect(analyzer);

    // analyzer.connect(this.context.destination);

    // this.source = source;
    // this.analyzer = analyzer;
    // this.gain = gain;

    // this.source.playbackRate.value = this.speed;
    // this.gain.gain.value = this.volume;
  }

  disconnect() {
    this.decodeId = 0;
    this.disposeDecoder();
    if (this.gain) {
      this.gain.disconnect();
      delete this.gain;
    }
    if (this.analyzer) {
      this.analyzer.disconnect();
      delete this.analyzer;
    }
    if (this.source) {
      this.source.disconnect();
      delete this.source;
    }
  }
  
  destroy() {
    this.disconnect();
    delete this.buffer;
  }

  mute() {
    this._savedVolume = this.volume;
    this.volume = 0;
  }

  unmute() {
    this.volume = this._savedVolume;
  }

  get length() {
    return this.analyzer?.frequencyBinCount ?? 0;
  }

  get dataLength() {
    return this.buffer?.length ?? 0;
  }

  get data() {
    this.connect();

    const data = new Uint8Array(this.length);

    if (this.analyzer) {
      this.analyzer.getByteTimeDomainData(data);
    }

    return data;
  }

  /**
   * Decode in chunks of up to 600 seconds until the whole file is decoded.
   * Do the work in a Web Worker to avoid blocking the UI.
   * Do the work in a interruptible generator to avoid blocking the worker.
   */
  private *chunkDecoder(options?: {multiChannel?: boolean}): Generator<Promise<Float32Array|null>|null> {
    if (!this.decoder || !this.decodeId) return null;

    const totalDuration = this.decoder.duration;

    let durationOffset = 0;
    const durationChunkSize = 60 * 30; // 30 minutes

    while (durationOffset < totalDuration) {
      console.log({ durationOffset, totalDuration });
      yield new Promise((resolve) => {
        if (!this.decoder) return resolve(null);

        const nextChunkDuration = Math.min(durationChunkSize, Math.max(0, totalDuration - durationOffset));

        console.log({ durationOffset, toDuration: nextChunkDuration });

        const currentOffset = durationOffset;

        durationOffset += nextChunkDuration;

        this.decoder.decodeAudioData(currentOffset, nextChunkDuration, {
          multiChannel: false,
          ...options,
        }).then(resolve);
      });
    }
  }

  cancelDecode() {
    this.decodeId = 0;
  }

  async decodeAudioData(arraybuffer: ArrayBuffer, length: number, options?: {multiChannel?: boolean}): Promise<{sampleRate: number, channelCount: number, duration: number}|undefined> {
    this.cancelDecode();
    this.decodeId = Date.now();

    return getAudioDecoderWorker(DecodeAudioWasm, arraybuffer).then(async (decoder) => {
      if (!this.decodeId) return null;

      this.decoder = decoder;

      const chunks = []; 

      const chunkIterator = this.chunkDecoder(options);

      // Work through the chunks of the file in a generator until done.
      // Allow this to be interrupted at any time safely.
      // eslint-disable-next-line
      while (true) {
        if (!this.decodeId) return null;

        const result = chunkIterator.next();

        if (!result.done) {
          const value = await result.value;

          if (value) {
            chunks.push(value);
          }
        }

        if (result.done) {
          return chunks;
        }
      }
    }).then(bufferData => {
      let meta = undefined;
      
      if (bufferData) {
        this.buffer = bufferData;
        console.log('bufferData', bufferData);
      }

      if (this.decoder) {
        meta = {
          sampleRate: this.decoder.sampleRate,
          channelCount: this.decoder.channelCount,
          duration: this.decoder.duration,
        };

        this._channelCount = meta.channelCount;
        this._sampleRate = meta.sampleRate;
        this._duration = meta.duration;
      } 

      return meta;
    }).finally(() => {
      this.disposeDecoder();
    });
      
    // if (!this.offline) {
    //   this.offline = this.createOfflineAudioContext();
    // }
    // // Safari doesn't support promise based decodeAudioData by default
    // if ('webkitAudioContext' in window) {
    //   this.offline?.decodeAudioData(
    //     arraybuffer,
    //     data => resolve(data),
    //     err => reject(err),
    //   );
    // } else {
    //   this.offline?.decodeAudioData(arraybuffer).then(
    //     resolve,
    //   ).catch(
    //     reject,
    //   );
    // }
  }

  private disposeDecoder() {
    if (this.decoder) {
      this.decoder.dispose();
      this.decoder = undefined;
    }
  }

  private createOfflineAudioContext(sampleRate?: number) {
    if (!(window as any).WebAudioOfflineAudioContext) {
      (window as any).WebAudioOfflineAudioContext = new (window.OfflineAudioContext ||
                (window as any).webkitOfflineAudioContext)(1, 2, sampleRate ?? this.sampleRate);
    }
    return (window as any).WebAudioOfflineAudioContext;
  }

  private createAudioContext() {
    if (!window.AudioContext) {
      return;
    }

    if ((window as any).WebAudioContext) {
      return (window as any).WebAudioContext as AudioContext;
    }

    (window as any).WebAudioContext = new AudioContext();

    return (window as any).WebAudioContext as AudioContext;
  }
}
