export interface WaveformAudioOptions {
  volume: number;
  muted: boolean;
  rate: number;
}

export class WaveformAudio {
  context: AudioContext;
  analyzer: AnalyserNode | null = null;
  source: AudioBufferSourceNode | null = null;
  gain: GainNode | null = null;
  buffer: AudioBuffer | null = null;

  private _rate = 1;
  private _volume = 1;
  private _muted = false;
  private _savedVolume = 1;
  private _channelCount = 1;

  constructor(options: WaveformAudioOptions) {
    this.context = new AudioContext();

    this._rate = options.rate;
    this._savedVolume = options.volume;
    this._volume = options.muted ? 0 : options.volume;
  }

  get channelCount() {
    return this._channelCount;
  }

  get sampleRate() {
    return this.context.sampleRate;
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

    const source = this.context.createBufferSource();

    source.buffer = this.buffer;

    const analyzer = this.context.createAnalyser();

    analyzer.fftSize = 2048;

    const gain = this.context.createGain();

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
    if (!this.source) return;

    this.analyzer?.disconnect();
    this.source.disconnect();
    this.gain?.disconnect();

    this.source = null;
    this.analyzer = null;
    this.gain = null;
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
}
