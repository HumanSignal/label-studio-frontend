import { Events } from '../Common/Events';
import { __DEBUG__ } from '../Common/Utils';
import { AudioDecoder, DEFAULT_FREQUENCY_HZ } from './AudioDecoder';
import { audioDecoderPool } from './AudioDecoderPool';

export interface WaveformAudioOptions {
  src?: string;
  volume?: number;
  muted?: boolean;
  rate?: number;
}

interface WaveformAudioEvents {
  decodingProgress: (chunk: number, total: number) => void;
  canplay: () => void;
}

export class WaveformAudio extends Events<WaveformAudioEvents> {
  decoder?: AudioDecoder;
  decoderPromise?: Promise<void>;
  mediaPromise?: Promise<void>;
  el?: HTMLAudioElement;

  // private backed by audio element and getters/setters
  // underscored to keep the public API clean
  private _rate = 1;
  private _volume = 1;
  private _savedVolume = 1;
  private src?: string;
  private mediaResolve?: () => void;

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
    delete this.mediaPromise;
    delete this.decoderPromise;
    this.decoder?.destroy();
    delete this.decoder;
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

  get chunks(): Float32Array[]|undefined {
    if (!this.decoder) return;

    return this.decoder.chunks;
  }

  async sourceDecoded() {
    if (!this.decoder) return false;
    if (this.mediaPromise) {
      await this.mediaPromise;
    }
    if (this.decoderPromise) {
      await this.decoderPromise;
    }

    return this.decoder.sourceDecoded;
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
    this.el.muted = true;
    if (__DEBUG__) {
      this.el.setAttribute('data-testid', 'waveform-audio');
      this.el.style.display = 'none';
      document.body.appendChild(this.el);
    }

    this.mediaPromise = new Promise((resolve) => {
      this.mediaResolve = resolve;
    });

    this.el.addEventListener('canplaythrough', this.mediaReady);
    this.loadMedia();
  }

  mediaReady = async () => {
    if (this.mediaResolve) {
      this.mediaResolve?.();
      this.mediaResolve = undefined;
      await this.forceBuffer();
    }
    this.invoke('canplay');
  };

  /**
   * Load the media element with the audio source and begin an initial playback buffer
   */
  private loadMedia() {
    if (!this.src || !this.el) return;
    
    this.el.src = this.src;
    this.el.load();
  }

  /**
   * In order for the audio to playback sound immediately, we need to force the browser to buffer the audio.
   * This works by just playing the audio and then immediately pausing it.
   */
  private async forceBuffer() {
    if (!this.el) return;

    try {
      await this.el.play();
      this.el.pause();
    } catch {
      // ignore
    } finally {
      if (this.el) {
        this.el.currentTime = 0;
        this.el.muted = false;
      }
    }

  }

  private createAudioDecoder() {
    if (!this.src || this.decoder) return;

    this.decoder = audioDecoderPool.getDecoder(this.src);

    this.decoder.on('progress', (chunk, total) => {
      this.invoke('decodingProgress', [chunk, total]);
    });
  }
}
