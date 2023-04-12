import { Events } from '../Common/Events';
import { __DEBUG__ } from '../Common/Utils';
import { audioDecoderPool } from './AudioDecoderPool';
import { BaseAudioDecoder, DEFAULT_FREQUENCY_HZ } from './BaseAudioDecoder';

export interface WaveformAudioOptions {
  src?: string;
  volume?: number;
  muted?: boolean;
  rate?: number;
  splitChannels?: boolean;
  decoderType?: 'ffmpeg' | 'webaudio';
}

interface WaveformAudioEvents {
  decodingProgress: (chunk: number, total: number) => void;
  canplay: () => void;
}

export class WaveformAudio extends Events<WaveformAudioEvents> {
  decoder?: BaseAudioDecoder;
  decoderPromise?: Promise<void>;
  mediaPromise?: Promise<void>;
  mediaReject?: (err: any) => void;
  el?: HTMLAudioElement;

  // private backed by audio element and getters/setters
  // underscored to keep the public API clean
  private _rate = 1;
  private _volume = 1;
  private _savedVolume = 1;
  private splitChannels = false;
  private decoderType: 'ffmpeg' | 'webaudio' = 'ffmpeg';
  private src?: string;
  private mediaResolve?: () => void;

  constructor(options: WaveformAudioOptions) {
    super();
    this._rate = options.rate ?? this._rate;
    this._savedVolume = options.volume ?? this._volume;
    this._volume = options.muted ? 0 : this._savedVolume;
    this.splitChannels = options.splitChannels ?? false;
    this.decoderType = options.decoderType ?? this.decoderType;
    this.src = options.src;
    this.createAudioDecoder();
    this.createMediaElement();
  }

  get channelCount() {
    return this.decoder?.channelCount || 1;
  }

  get duration() {
    return this.el?.duration ?? 0;
  }

  get sampleRate() {
    return this.decoder?.sampleRate || DEFAULT_FREQUENCY_HZ;
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
    this._volume = value;

    if (this.el) {
      this.el.volume = value;
    }
  }

  get speed() {
    return this._rate ?? 1;
  }

  set speed(value: number) {
    this._rate = value;

    if (this.el) {
      this.el.playbackRate = this._rate;
    }
  }

  get muted() {
    return this.volume === 0;
  }

  disconnect() {
    try {
      if (this.el && !this.el.paused) {
        this.el.pause();
      }
    } catch {
      // ignore
    }
    this.decoder?.cancel();
  }
  
  destroy() {
    super.destroy();
    this.disconnect();

    delete this.mediaResolve;
    delete this.mediaReject;
    delete this.mediaPromise;
    delete this.decoderPromise;
    this.decoder?.destroy();
    delete this.decoder;
    this.el?.removeEventListener('error', this.mediaReady);
    this.el?.removeEventListener('canplaythrough', this.mediaReady);
    this.el?.remove();
    delete this.el;
  }

  mute() {
    this._savedVolume = this.volume || 1;
    this.volume = 0;
    if (this.el) {
      this.el.muted = true;
    }
  }

  unmute() {
    this.volume = this._savedVolume || 1; // 1 is the default volume, if manually muted this will be 0 and we want to restore to 1
    if (this.el) {
      this.el.muted = false;
    }
  }

  get chunks(): Float32Array[][]|undefined {
    if (!this.decoder) return;

    return this.decoder.chunks;
  }

  async sourceDecoded() {
    if (!this.decoder) return false;
    try {
      if (this.mediaPromise) {
        await this.mediaPromise;
      }
      if (this.decoderPromise) {
        await this.decoderPromise;
      }

      return this.decoder.sourceDecoded;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async initDecoder(arraybuffer?: ArrayBuffer) {
    if (!this.decoder) return;

    if (!this.decoderPromise && arraybuffer) {
      this.decoderPromise = this.decoder.init(arraybuffer);
    }

    return this.decoderPromise;
  }

  async decodeAudioData(options?: {multiChannel?: boolean}) {
    if (!this.decoder) return;

    return this.decoder.decode(options);
  }

  private createMediaElement() {
    if (!this.src || this.el) return;

    this.el = document.createElement('audio');
    this.el.preload = 'auto';
    this.el.setAttribute('data-testid', 'waveform-audio');
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    this.mediaPromise = new Promise((resolve, reject) => {
      this.mediaResolve = resolve;
      this.mediaReject = reject;
    });

    this.el.addEventListener('canplaythrough', this.mediaReady);
    this.el.addEventListener('error', this.mediaReady);
    this.loadMedia();
  }

  mediaReady = async (e: any) => {
    if (e.type === 'error') {
      this.mediaReject?.(this.el?.error);
    } else {
      if (this.mediaResolve) {
        this.mediaResolve?.();
        this.mediaResolve = undefined;
      }
      this.invoke('canplay');
    }
  };

  /**
   * Load the media element with the audio source and begin an initial playback buffer
   */
  private loadMedia() {
    if (!this.src || !this.el) return;
    
    this.el.src = this.src;
  }

  private createAudioDecoder() {
    if (!this.src || this.decoder) return;

    this.decoder = audioDecoderPool.getDecoder(this.src, this.splitChannels, this.decoderType);

    this.decoder.on('progress', (chunk, total) => {
      this.invoke('decodingProgress', [chunk, total]);
    });
  }
}
