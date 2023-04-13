import { Destructable } from '../Common/Destructable';
import { WaveformAudio } from '../Media/WaveformAudio';
import { clamp } from '../Common/Utils';
import { Waveform } from '../Waveform';

export class Player extends Destructable {
  private audio?: WaveformAudio;
  private wf: Waveform;
  private timer!: number;
  private loop:  {start: number, end: number}|null = null;
  private timestamp = 0;
  private time = 0;
  private connected = false;
  private bufferPromise?: Promise<void>;
  private bufferResolve?: () => void;
  private ended = false;
  private _rate = 1;

  playing = false;
  hasPlayed = false;

  constructor(wf: Waveform) {
    super();

    this.wf = wf;
    this._rate = wf.params.rate ?? this._rate;
  }

  /**
   * Get current playback speed
   */
  get rate() {
    if (this.audio) {
      if (this.audio.speed !== this._rate) {
        this.audio.speed = this._rate; // restore the correct rate
      }
    }

    return this._rate;
  }

  /**
   * Set playback speed
   */
  set rate(value: number) {
    const rateChanged = this._rate !== value;

    this._rate = value;

    if (this.audio) {
      this.audio.speed = value;

      if (rateChanged) {
        this.wf.invoke('rateChanged', [value]);
      }
    }
  }

  get duration() {
    return this.audio?.duration ?? 0;
  }

  get volume() {
    return this.audio?.volume ?? 1;
  }

  set volume(value: number) {
    if (this.audio) {

      const volumeChanged = this.volume !== value;

      if (volumeChanged) {
        if (value === 0) {
          this.muted = true;
        } else if(this.muted) {
          this.muted = false;
        } else {
          this.audio.volume = value;
        }

        this.wf.invoke('volumeChanged', [this.volume]);
      }
    }
  }

  get currentTime() {
    return this.time;
  }

  private set currentTime(value: number) {
    this.ended = false;
    this.setCurrentTime(value, true);
  }

  setCurrentTime(value: number, notify = false) {
    const timeChanged = this.time !== value;

    this.time = value;

    if (timeChanged && this.audio?.el) {
      this.audio.el.currentTime = this.time;
    }

    if (notify && timeChanged) {
      this.wf.invoke('seek', [this.time]);
    }
  }

  get muted() {
    return this.audio?.muted ?? false;
  }

  set muted(muted: boolean) {
    if (!this.audio) return;
    if (this.muted === muted) return;

    if (muted) {
      this.audio.mute();
    } else {
      this.audio.unmute();
    }

    this.wf.invoke('muted', [this.audio.muted]);
  }

  get canPause() {
    return !!(this.audio?.el && !this.audio.el.paused && this.hasPlayed);
  }

  init(audio: WaveformAudio) {
    this.audio = audio;
    this.audio.on('canplay', this.handleCanPlay);
    if (this.audio.el) {
      this.audio.el.addEventListener('play', this.handlePlayed);
      this.audio.el.addEventListener('pause', this.handlePaused);
    }
  }

  seek(time: number) {
    const newTime = clamp(time, 0, this.duration);

    this.currentTime = newTime;

    if (this.playing) {
      this.updatePlayback();
    }
  }

  seekSilent(time: number) {
    const newTime = clamp(time, 0, this.duration);

    this.ended = false;
    this.setCurrentTime(newTime);

    if (this.playing) {
      this.updatePlayback();
    }
  }

  play(from?: number, to?: number) {
    if (this.isDestroyed || this.playing || !this.audio) return;
    if (this.ended) {
      this.currentTime = from ?? 0;
    }
    const { start, end } = this.playSelection(from, to);

    this.playRange(start, end);
  }

  private handlePlayed = () => {
    this.hasPlayed = true;
  };

  private handlePaused = () => {
    this.hasPlayed = false;
  };

  private handleEnded = () => {
    if (this.loop) return;
    this.updateCurrentTime(true);
  };

  private handleCanPlay = () => {
    this.bufferResolve?.();
  };

  private playEnded() {
    this.ended = true;
    this.pause();
    this.wf.invoke('playend');
  }

  pause() {
    if (this.isDestroyed || !this.playing || !this.audio) return;
    this.stopWatch();
    this.disconnectSource();
    this.playing = false;
    this.loop = null;
    this.wf.invoke('pause');
    this.wf.invoke('seek', [this.currentTime]);
  }

  stop() {
    if (this.isDestroyed) return;
    this.stopWatch();
    this.disconnectSource();
    this.playing = false;
    this.loop = null;
  }

  destroy() {
    this.stop();
    this.cleanupSource();
    this.bufferPromise = undefined;
    this.bufferResolve = undefined;
    if (this.audio?.el) {
      this.audio.el.removeEventListener('play', this.handlePlayed);
      this.audio.el.removeEventListener('pause', this.handlePaused);
    }
    super.destroy();
  }

  private updatePlayback() {
    const { start, end } = this.playSelection();

    this.playSource(start, end);
  }

  private playRange(start?: number, end?: number) {
    if (start) {
      this.currentTime = start;
    }
    this.playSource(start, end);
    this.wf.invoke('play');
  }

  private playSource(start?: number, duration?: number) {
    this.stopWatch();
    this.connectSource();

    if (!this.audio) return;

    this.playing = true;

    if (this.loop) {
      if (this.currentTime < this.loop.start || this.currentTime > this.loop.end) {
        this.currentTime = this.loop.start;
      }

      duration = clamp(this.loop.end, 0, this.duration);
      start = clamp(this.loop.start, 0, duration);
    }

    if (this.audio.el) {
      this.audio.el.currentTime = this.currentTime;
      this.audio.el.addEventListener('ended', this.handleEnded);
      this.bufferPromise = new Promise(resolve => {
        this.bufferResolve = resolve;
      });

      const time = this.currentTime;

      this.audio.el.play().then(() => this.bufferPromise!.then()).then(() => {
        this.timestamp = performance.now();

        // We need to compensate for the time it took to load the buffer
        // otherwise the audio will be out of sync of the timer we use to
        // render updates
        if (this.audio?.el) {
          // This must not be notifying of this adjustment otherwise it can cause sync issues and near infinite loops
          this.setCurrentTime(time);
          this.audio.el.currentTime = this.currentTime;
          this.watch();
        }
      });
    }
  }

  private playSelection(from?: number, to?: number) {
    const selected = this.wf.regions.selected;

    const looping = selected.length > 0;

    if (looping) {
      const regionsStart = Math.min(...selected.map(r => r.start));
      const regionsEnd = Math.max(...selected.map(r => r.end));

      const start = clamp(this.currentTime, regionsStart, regionsEnd);

      this.loop = { start: regionsStart, end: regionsEnd };

      return {
        start,
        end: regionsEnd,
      };
    } 
    const start = from ?? this.currentTime;
    const end = to !== undefined ? (to - start) : undefined;

    return { start, end };
  }

  private connectSource() {
    if (this.isDestroyed || !this.audio || this.connected) return;
    this.connected = true;

    // Control pausing playback with checks to whether the audio has been asynchronously played already
    // This is to prevent DomException: The play() request was interrupted by a call to pause()
    if (this.canPause) {
      this.audio.disconnect();
    }
  }

  private disconnectSource() {
    if (this.isDestroyed || !this.audio || !this.connected) return;
    this.connected = false;

    if (this.audio.el) {
      this.audio.el.removeEventListener('ended', this.handleEnded);
    }

    // Control pausing playback with checks to whether the audio has been asynchronously played already
    // This is to prevent DomException: The play() request was interrupted by a call to pause()
    if (this.canPause) {
      this.audio.disconnect();
    }
  }

  private cleanupSource() {
    if (this.isDestroyed || !this.audio) return;
    this.disconnectSource();
    this.audio.destroy();
    delete this.audio;
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
      this.playing = false;
      this.play();
    }
  }

  private updateCurrentTime(forceEnd = false) {
    const now = performance.now();
    const tick = ((now - this.timestamp) / 1000) * this.rate;

    this.timestamp = now;

    const end = this.loop?.end ?? this.duration;

    const newTime = forceEnd ? this.duration : clamp(this.time + tick, 0, end); 

    this.time = newTime;

    if (!this.loop && this.time >= this.duration - tick) {
      this.time = this.duration;
      this.wf.invoke('playing', [this.duration]);
      this.playEnded();
    } else {
      this.wf.invoke('playing', [this.time]);
    }
  }

  private stopWatch() {
    cancelAnimationFrame(this.timer);
  }
}
