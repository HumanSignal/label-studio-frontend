import { Destructable } from '../Common/Destructable';
import { Waveform } from '../Waveform';
import { WaveformAudio, WaveformAudioOptions } from './WaveformAudio';

export type Options = {
  src: string,
}

export class MediaLoader extends Destructable {
  private wf: Waveform;
  private audio?: WaveformAudio;
  private loaded = false;
  private options: Options;
  private cancel: () => void;

  duration = 0;
  sampleRate = 0;
  loadingProgressType: 'determinate' | 'indeterminate';

  static promiseChain: Promise<any> |null = null;

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

  async decodeAudioData(arrayBuffer: ArrayBuffer) {
    if (!this.audio?.context || this.isDestroyed) return null;

    return await this.audio.context.decodeAudioData(arrayBuffer).then((buffer) => {
      if (this.isDestroyed) return null;
      return buffer;
    });
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
        this.sampleRate = audio.sampleRate ?? buffer.sampleRate;
        this.loaded = true;
        audio.buffer = buffer;
        audio.connect();
        return audio;
      };

      try {

        if (!audio.context) {
          return Promise.resolve(null);
        }

        if (MediaLoader.promiseChain) {
          MediaLoader.promiseChain = MediaLoader.promiseChain.then(() => {
            return this.decodeAudioData(xhr.response);
          }).then((buffer) => {
            if (buffer) {
              return playAudio(buffer);
            }
            return null;
          });
        } else {
          MediaLoader.promiseChain = this.decodeAudioData(xhr.response).then((buffer) => {
            if (buffer) {
              return playAudio(buffer);
            }
            return null;
          }).finally(() => {
            MediaLoader.promiseChain = null;
          });
        }

        return MediaLoader.promiseChain;
      } catch (err) {
      // TODO: Handle properly (exiquio)
      // NOTE: error is being received
        console.error('An audio decoding error occurred', err);
      }
    }

    return null;
  }

  destroy() {
    if (this.isDestroyed) return;

    super.destroy();
    this.reset();

    if (this.audio) {
      this.audio.disconnect();

      if (this.audio.context) {
        this.audio.context.close().then(() => {
          console.log('destroyed context');
        });
      }

      delete this.audio.context;
      delete this.audio.buffer;
      delete this.audio;
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
