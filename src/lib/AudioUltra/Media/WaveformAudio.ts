import { Events } from '../Common/Events';
import { AudioDecoder } from './AudioDecoder';

export interface WaveformAudioOptions {
  src?: string;
  volume?: number;
  muted?: boolean;
  rate?: number;
}

interface WaveformAudioEvents {
  decodingProgress: (chunk: number, total: number) => void;
}

export class WaveformAudio extends Events<WaveformAudioEvents> {
  decoder?: AudioDecoder;
  decoderPromise?: Promise<void>;
  el?: HTMLAudioElement;

  // private backed by audio element and getters/setters
  // underscored to keep the public API clean
  private _rate = 1;
  private _volume = 1;
  private _savedVolume = 1;
  private src?: string;

  constructor(options: WaveformAudioOptions) {
    super();
    this._rate = options.rate ?? this._rate;
    this._savedVolume = options.volume ?? this._volume;
    this._volume = options.muted ? 0 : this._savedVolume;
    this.src = options.src;
    this.createAudioDecoder();
    this.createMediaElement();
  }

  get channelCount() {
    return this.decoder?.channelCount || 1;
  }

  get duration() {
    return this.decoder?.duration || 0;
  }

  get sampleRate() {
    return this.decoder?.sampleRate || 44100;
  }

  get dataLength() {
    return this.decoder?.dataLength || 0;
  }

  get dataSize() {
    return this.decoder?.dataSize || 0;
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
    this.el?.pause();
    this.decoder?.cancel();
  }
  
  destroy() {
    super.destroy();
    this.disconnect();
    delete this.decoderPromise;
    this.decoder?.destroy();
    delete this.decoder;
    delete this.el;
  }

  mute() {
    this._savedVolume = this.volume;
    this.volume = 0;
  }

  unmute() {
    this.volume = this._savedVolume;
  }

  chunks(): Float32Array[]|undefined {
    if (!this.decoder) return;

    return this.decoder.chunks;
  }

  async sourceDecoded() {
    if (!this.decoder) return false;

    if (this.decoderPromise) {
      await this.decoderPromise;
    }

    return this.decoder.sourceDecoded;
  }

  async decodeAudioData(arraybuffer: ArrayBuffer, options?: {multiChannel?: boolean}) {
    if (!this.decoder) return;

    const decoded = this.decoder.decode(arraybuffer, options);

    this.decoderPromise = (this.decoder.decoderPromise || Promise.resolve());

    return decoded;
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

  private createAudioDecoder() {
    if (!this.src || this.decoder) return;

    this.decoder = new AudioDecoder(this.src);

    this.decoder.on('progress', (chunk, total) => {
      this.invoke('decodingProgress', [chunk, total]);
    });
  }
}
