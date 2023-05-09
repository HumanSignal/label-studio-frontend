import { WaveformAudio } from '../Media/WaveformAudio';
import { Waveform } from '../Waveform';
import { Player } from './Player';

export class WebAudioPlayer extends Player {
  private audioContext?: AudioContext;
  private audioBufferSource?: AudioBufferSourceNode;
  private gainNode?: GainNode;

  constructor(wf: Waveform) {
    super(wf);

    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  async init(audio: WaveformAudio) {
    super.init(audio);

    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  get volume() {
    return this.gainNode?.gain.value ?? 1;
  }

  set volume(value: number) {
    if (this.gainNode) {
      const volumeChanged = this.volume !== value;

      if (volumeChanged) {
        if (value === 0) {
          this.muted = true;
        } else if (this.muted) {
          this.muted = false;
        } else {
          this.gainNode.gain.value = value;
        }

        this.wf.invoke('volumeChanged', [this.volume]);
      }
    }
  }

  get muted() {
    return this.gainNode?.gain.value === 0 ?? false;
  }

  set muted(muted: boolean) {
    if (!this.gainNode) return;
    if (this.muted === muted) return;

    if (muted) {
      this.gainNode.gain.value = 0;
    } else {
      this.gainNode.gain.value = this.volume;
    }

    this.wf.invoke('muted', [this.muted]);
  }

  get duration() {
    return this.audio?.buffer?.duration ?? 0;
  }

  destroy() {
    super.destroy();

    if (this.audioContext) {
      this.audioContext.close().finally(() => {
        delete this.audioContext;
      });
    }
  }

  protected playAudio(start?: number, duration?: number) {
    if (!this.audioBufferSource) return;

    if (start) {
      this.audioBufferSource.start(0, start);
    } else {
      this.audioBufferSource.start(0);
    }

    this.timestamp = performance.now();
    this.watch();
  }

  protected connectSource() {
    if (this.isDestroyed || !this.audioContext || !this.audio?.buffer || !this.gainNode || this.connected) return;
    this.connected = true;
    this.audioBufferSource = this.audioContext.createBufferSource();
    this.audioBufferSource.buffer = this.audio.buffer;
    this.audioBufferSource.connect(this.gainNode);
    this.audioBufferSource.onended = this.handleEnded;
  }

  protected disconnectSource(): boolean {
    if (this.isDestroyed || !this.connected || !this.audioBufferSource) return false;
    this.connected = false;

    this.audioBufferSource.stop();
    this.audioBufferSource.disconnect();
    this.audioBufferSource.onended = null;
    this.audioBufferSource = undefined;

    return true;
  }

  protected playSource(start?: number, end?: number) {
    this.disconnectSource();
    super.playSource(start, end);
  }

  protected updateCurrentSourceTime(timeChanged: boolean) {
    if (timeChanged && this.audioBufferSource) {
      this.disconnectSource();
      this.connectSource();
      this.audioBufferSource.start(0, this.time);
    }
  }

  protected cleanupSource() {
    super.cleanupSource();
    this.audioBufferSource = undefined;
  }
}
