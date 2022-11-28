import { Destructable } from "../Common/Destructable";
import { WaveformAudio } from "../Media/WaveformAudio";
import { clamp } from "../Common/Utils";
import { Waveform } from "../Waveform";

export class Player extends Destructable {
  private audio!: WaveformAudio;
  private wf: Waveform;
  private timer!: number;
  private loop:  {start: number, end: number}|null = false;
  private timestamp = 0;
  private time = 0;

  playing = false;

  constructor(wf: Waveform) {
    super();

    this.wf = wf;
  }

  /**
   * Get current playback speed
   */
  get rate() {
    return this.audio.source?.playbackRate.value ?? 0;
  }

  /**
   * Set playback speed
   */
  set rate(value: number) {
    if (this.audio.source) {
      this.audio.source.playbackRate.value = value;
      this.wf.invoke("rateChanged", [value]);
    }
  }

  get duration() {
    return this.audio.buffer?.duration ?? 0;
  }

  get volume() {
    return this.audio.gain?.gain.value ?? 1;
  }

  set volume(value: number) {
    if (this.audio) {
      this.audio.volume = value;
      this.wf.invoke("volumeChange", [value]);
    }
  }

  get currentTime() {
    return this.time;
  }

  private set currentTime(value: number) {
    this.setCurrentTime(value, true);
  }

  setCurrentTime(value: number, notify = false) {
    this.time = value;
    if (notify) {
      this.wf.invoke("seek", [this.time]);
    }
  }

  get muted() {
    return this.audio.volume === 0;
  }

  set muted(muted: boolean) {
    if (!this.audio) return;

    if (this.audio.muted === muted) return;

    if (muted) {
      this.audio.mute();
    } else {
      this.audio.unmute();
    }

    this.wf.invoke("muted", [this.audio.muted]);
  }

  init(audio: WaveformAudio) {
    this.audio = audio;

    // this.audio.context.addEventListener("statechange", (e) => {
    //   console.log(e);
    // });
  }

  seek(time: number) {
    const newTime = clamp(time, 0, this.duration);

    this.currentTime = newTime;

    if (this.playing) {
      this.playSelection();
      this.playSource();
    }
  }

  play(from?: number, to?: number) {
    if (this.isDestroyed) return;
    if (this.playing) {
      this.pause();
      return;
    }
    const { start, end } = this.playSelection(from, to);

    this.playRange(start, end);
  }

  handleEnded = () => {
    this.updateCurrentTime();
    if (this.loop) {
      return;
    }
    this.audio.source?.removeEventListener("ended", this.handleEnded);
    this.pause();
    this.wf.invoke("playend");
  };

  pause() {
    if (this.isDestroyed) return;
    if (this.playing) {
      this.stopWatch();
      this.disconnectSource();
      this.playing = false;
      this.loop = null;
      this.wf.invoke("pause");
      this.wf.invoke("seek", [this.currentTime]);
    }
  }

  stop() {
    if (this.isDestroyed) return;

    this.stopWatch();
    this.loop =null;

    this.audio.context.suspend().then(() => {
      this.audio.source?.stop(0);
      this.audio.disconnect();
      this.playing = false;
    });
  }

  destroy() {
    this.stop();
  }

  private playRange(start?: number, end?: number) {
    if (start) {
      this.currentTime = start;
    }
    this.playSource(start, end);
    this.wf.invoke("play");
  }

  private playSource(start?: number, duration?: number) {
    this.stopWatch();
    this.timestamp = performance.now();
    this.recreateSource();
    this.playing = true;

    if (!this.audio.source) return;

    if (this.loop) {
      const loopStart = clamp(start ?? this.currentTime, 0, this.duration);

      this.audio.source.loop = true;
      this.audio.source.loopStart = loopStart;
      this.audio.source.loopEnd = (duration ?? this.duration);
      this.audio.source.start(0, loopStart);
    } else {
      this.audio.source.start(0, start ?? 0, duration ?? this.duration);
    }

    this.audio.source.addEventListener("ended", this.handleEnded);

    this.watch();
  }

  private playSelection(from?: number, to?: number) {
    const selected = this.wf.regions.selected;

    const looping = selected.length > 0;

    if (looping) {
      const regionsStart = Math.min(...selected.map(r => r.start));
      const regionsEnd = Math.max(...selected.map(r => r.end));

      this.loop = { start: regionsStart, end: regionsEnd };

      return this.loop;
    } 
    const start = from ?? this.currentTime;
    const end = to !== undefined ? (to - start) : undefined;

    return { start, end };
  }

  private recreateSource() {
    if (this.playing) {
      this.disconnectSource();
    }
    this.connectSource();
  }

  private connectSource() {
    if (this.isDestroyed || !this.audio) return;
    this.audio.connect();
  }

  private disconnectSource() {
    if (this.isDestroyed || !this.audio) return;
    this.audio.source?.removeEventListener("ended", this.handleEnded);
    this.audio.source?.stop();
    this.audio.disconnect();
  }

  private watch = () => {
    if (!this.playing) return;

    this.updateCurrentTime();
    this.updateLoop(this.time);

    this.timer = requestAnimationFrame(this.watch);
  };

  private updateLoop(time: number) {
    if (this.isDestroyed || !this.loop) return;
    if (time >= this.loop.end) {
      this.currentTime = this.loop.start;
    }
  }

  private updateCurrentTime() {
    const now = performance.now();
    const tick = (( now - this.timestamp) / 1000) * this.rate;

    this.timestamp = now;

    const newTime = clamp(this.time + tick, 0, this.duration); 

    this.time = newTime;
    this.wf.invoke("playing", [this.time]);
  }

  private stopWatch() {
    cancelAnimationFrame(this.timer);
  }
}
