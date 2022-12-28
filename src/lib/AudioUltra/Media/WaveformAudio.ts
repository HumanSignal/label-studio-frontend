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
  buffer?: AudioBuffer;

  private _rate = 1;
  private _volume = 1;
  private _muted = false;
  private _savedVolume = 1;
  private _channelCount = 1;

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
    return this.context?.sampleRate ?? 44100;
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
    if (!this.context || !this.buffer) return;

    const source = this.context?.createBufferSource();

    if (!source) return;

    source.buffer = this.buffer;

    const analyzer = this.context?.createAnalyser();

    if (!analyzer) return;

    analyzer.fftSize = 2048;

    const gain = this.context?.createGain();

    if (!gain) return;

    source.connect(gain);

    gain.connect(analyzer);

    analyzer.connect(this.context.destination);

    this.source = source;
    this.analyzer = analyzer;
    this.gain = gain;

    this.source.playbackRate.value = this.speed;
    this.gain.gain.value = this.volume;
    this._channelCount = source.channelCount;
  }

  disconnect() {
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

  async decodeAudioData(arraybuffer: ArrayBuffer): Promise<AudioBuffer | null | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.offline) {
        this.offline = this.createOfflineAudioContext();
      }
      // Safari doesn't support promise based decodeAudioData by default
      if ('webkitAudioContext' in window) {
        this.offline?.decodeAudioData(
          arraybuffer,
          data => resolve(data),
          err => reject(err),
        );
      } else {
        this.offline?.decodeAudioData(arraybuffer).then(
          resolve,
        ).catch(
          reject,
        );
      }
    });
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
