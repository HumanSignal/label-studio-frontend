import { Destructable } from '../Common/Destructable';
import { Waveform } from '../Waveform';
import { WaveformAudio, WaveformAudioOptions } from './WaveformAudio';

export type Options = {
  src: string,
}

export class MediaLoader extends Destructable {
  private wf: Waveform;
  private audio!: WaveformAudio | null;
  private loaded = false;
  private options: Options;
  private cancel: () => void;

  duration = 0;
  sampleRate = 0;
  loadingProgressType: 'determinate' | 'indeterminate';

  constructor(wf: Waveform, options: Options) {
    super();
    this.wf = wf;
    this.options = options;
    this.cancel = () => {};
    this.loadingProgressType = 'determinate';
  }

  reset() {
    this.cancel();
    this.loaded = false;
    this.loadingProgressType = 'determinate';
  }

  async load(options: WaveformAudioOptions): Promise<WaveformAudio| null> {
    if (this.isDestroyed || this.loaded) {
      return Promise.resolve(null);
    }

    const audio = this.createAnalyzer(options);
    const xhr = await this.performRequest(this.options.src);

    if (xhr.status === 200 && xhr.response) {
      const playAudio = (buffer: AudioBuffer) => {
        this.duration = buffer.duration;
        this.sampleRate = audio.sampleRate;
        this.loaded = true;
        audio.buffer = buffer;
        audio.connect();
        return audio;
      };

      try {
        const buffer = await audio.context.decodeAudioData(
          xhr.response,
        );

        return playAudio(buffer);
      } catch (err) {
      // TODO: Handle properly (exiquio)
      // NOTE: error is being received
        console.error('An audio decoding error occurred', err);
      }
    }

    return null;
  }

  destroy() {
    super.destroy();
    this.reset();

    if (this.audio) {
      this.audio.buffer = null;
      this.audio.disconnect();
      this.audio.context.close();
      this.audio = null;
    }
  }

  private async performRequest(url: string): Promise<XMLHttpRequest> {
    const xhr = new XMLHttpRequest();

    this.cancel = () => {
      xhr?.abort();
      this.cancel = () => {};
    };

    return new Promise<XMLHttpRequest>((resolve, reject) => {
      xhr.responseType = 'arraybuffer';

      xhr.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          this.loadingProgressType = 'determinate';
          this.wf.setLoadingProgress(e.loaded, e.total);
        } else {
          this.loadingProgressType = 'indeterminate';
          this.wf.setLoadingProgress(e.loaded, -1);
        }
      });

      xhr.addEventListener('load', async () => {
        this.wf.setLoadingProgress(undefined, undefined, true);
        resolve(xhr);
      });

      xhr.addEventListener('error', () => {
        reject(xhr);
      });

      xhr.open('GET', url);
      xhr.send();
    });
  }

  private createAnalyzer(options: WaveformAudioOptions): WaveformAudio {
    if (this.audio) return this.audio;

    return this.audio = new WaveformAudio(options);
  }
}
