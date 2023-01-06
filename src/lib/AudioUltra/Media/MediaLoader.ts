import { Destructable } from '../Common/Destructable';
import { Waveform } from '../Waveform';
import { WaveformAudio, WaveformAudioOptions } from './WaveformAudio';

export type Options = {
  src: string,
}

type MediaResponse = ArrayBuffer|null;

export class MediaLoader extends Destructable {
  private wf: Waveform;
  private audio?: WaveformAudio | null;
  private loaded = false;
  private options: Options;
  private cancel: () => void;
  private decoderResolve?: () => void;
  private _duration = 0;
  
  decoderPromise?: Promise<void>;
  loadingProgressType: 'determinate' | 'indeterminate';

  constructor(wf: Waveform, options: Options) {
    super();
    this.wf = wf;
    this.options = options;
    this.cancel = () => {};
    this.loadingProgressType = 'determinate';
  }

  get duration() {
    return this._duration;
  }

  set duration(duration: number) {
    const changed = this._duration !== duration;

    this._duration = duration;
    
    if (changed) {
      this.wf.invoke('durationChanged', [duration]);
    }
  }

  get sampleRate() {
    return this.audio?.sampleRate || 0;
  }

  reset() {
    this.cancel();
    this.loaded = false;
    this.loadingProgressType = 'determinate';
    this.decoderResolve = undefined;
    this.decoderPromise = undefined;
  }

  async decodeAudioData(arrayBuffer: ArrayBuffer) {
    if (!this.audio || this.isDestroyed) return null;

    return await this.audio.decodeAudioData(arrayBuffer, {
      multiChannel: (this.wf.params.enabledChannels?.length || 1) > 1,
    });
  }

  async load(options: WaveformAudioOptions): Promise<WaveformAudio| null> {
    if (this.isDestroyed || this.loaded) {
      return Promise.resolve(null);
    }

    this.decoderPromise = new Promise((resolve) => {
      this.decoderResolve = resolve;
    });

    this.createAnalyzer({
      ...options,
      src: this.options.src,
    });

    if (!this.audio) {
      return Promise.resolve(null);
    }

    if (await this.audio.sourceDecoded()) {
      this.duration = this.audio.duration;
      this.decoderResolve?.();
      return this.audio;
    }

    const req = await this.performRequest(this.options.src);

    if (req) {
      try {
        if (!this.audio) {
          return Promise.resolve(null);
        }

        const decodingPromise = this.decodeAudioData(req);

        if (this.audio) {
          const decoderPromise = this.audio.decoderPromise || Promise.resolve();

          await decoderPromise.then(() => {
            if (this.decoderResolve && this.audio) {
              this.duration = this.audio.duration;
              this.decoderResolve();
            }
          });
        }

        return decodingPromise.then(() => {
          return this.audio ?? null;
        });
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
      this.audio.destroy();
      this.audio = null;
    }
  }

  private async performRequest(url: string): Promise<MediaResponse> {
    const xhr = new XMLHttpRequest();

    this.cancel = () => {
      xhr?.abort();
      this.cancel = () => {};
    };

    return new Promise<MediaResponse>((resolve, reject) => {
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
        resolve(xhr.response);
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

    this.audio = new WaveformAudio(options);

    this.audio.on('decodingProgress', (chunk, total) => {
      this.wf.setDecodingProgress(chunk, total);
    });

    return this.audio;
  }
}
