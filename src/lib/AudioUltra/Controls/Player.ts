import { Destructable } from "../Common/Destructable";
import { WaveformAudio } from "../Media/WaveformAudio";
import { clamp } from "../Common/Utils";
import { Waveform } from "../Waveform";

export class Player extends Destructable {
  private audio!: WaveformAudio;
  private wf: Waveform;
  private timer!: number;
  private looping: boolean | undefined;
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
    this.time = value;
    this.wf.invoke("seek", [this.time]);
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

    if (this.playing) {
      this.pause();
      this.currentTime = newTime;
      setTimeout(() => this.play());
    } else {
      this.currentTime = newTime;
    }
  }


  playRange(start: number, end: number | undefined) {
    this.currentTime = start;
    this.stopWatch();
    this.timestamp = performance.now();
    this.playing = true;

    this.audio.connect();
    this.audio.source?.start(0, start, end);

    this.audio.source?.addEventListener("ended", this.handleEnded);
    this.wf.invoke("play");
    this.watch();
  }

  play(from?: number, to?: number) {
    if (this.isDestroyed) return;

    if (!this.playing || this.looping) {
      const selected = this.wf.regions.selected;

      if (selected.length > 0) {
        const regionsStart = selected[0].start;
        const regionsEnd = selected[selected.length - 1].end - regionsStart;

        this.looping = true;
        return this.playRange(regionsStart, regionsEnd);
      }
      this.looping = false;
      const start = from ?? this.currentTime;
      const end = to !== undefined ? (to - start) : undefined;

      this.playRange(start, end);
    } else this.stop();
  }

  handleEnded = () => {
    this.audio.source?.removeEventListener("ended", this.handleEnded);
    if (this.looping) return this.play();
    this.pause();
    this.updateCurrentTime();
    this.wf.invoke("playend");
  };

  pause() {
    if (this.isDestroyed) return;
    if (this.playing) {
      this.stopWatch();
      this.audio.source?.stop();
      this.audio.disconnect();
      this.playing = false;
      this.wf.invoke("pause");
      this.wf.invoke("seek", [this.currentTime]);
      this.looping = false;
    }
  }

  stop() {
    if (this.isDestroyed) return;

    this.stopWatch();
    this.looping = false;

    this.audio.context.suspend().then(() => {
      this.audio.source?.stop(0);
      this.audio.disconnect();
      this.playing = false;
    });
  }

  destroy() {
    this.stop();
  }

  private watch = () => {
    if (!this.playing) return;

    this.updateCurrentTime();

    this.timer = requestAnimationFrame(this.watch);
  };

  private updateCurrentTime() {
    const tick = ((performance.now() - this.timestamp) / 1000) * this.rate;

    this.timestamp = performance.now();

    this.time = clamp(this.time + tick, 0, this.duration);
    this.wf.invoke("playing", [this.time]);
  }

  private stopWatch() {
    cancelAnimationFrame(this.timer);
  }
}
