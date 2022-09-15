import { Destructable } from "../Common/Destructable";
import { Waveform } from "../Waveform";
import { WaveformAudio, WaveformAudioOptions } from "./WaveformAudio";

export type Options = {
  src: string,
}

export class MediaLoader extends Destructable {
  private wf: Waveform;
  private audio!: WaveformAudio | null;
  private loaded = false;
  private options: Options;

  constructor(wf: Waveform, options: Options) {
    super();
    this.wf = wf;
    this.options = options;
  }

  async load(options: WaveformAudioOptions): Promise<WaveformAudio| null> {
    if (this.isDestroyed || this.loaded) {
      return Promise.resolve(null);
    }

    const audio = this.createAnalyzer(options);
    const xhr = await this.performRequest(this.options.src);

    if (xhr.status === 200 && xhr.response) {
      const playAudio = (buffer: AudioBuffer) => {
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

    if (this.audio) {
      this.audio.buffer = null;
      this.audio.disconnect();
      this.audio.context.close();
      this.audio = null;
    }
  }

  private performRequest(url: string) {
    const xhr = new XMLHttpRequest();

    return new Promise<XMLHttpRequest>((resolve, reject) => {
      xhr.responseType = "arraybuffer";

      // xhr.addEventListener("progress", (e) => {
      //   console.log(Math.round(e.loaded / e.total * 100));
      // });

      xhr.addEventListener("load", async () => {
        resolve(xhr);
      });

      xhr.addEventListener("error", () => {
        reject(xhr);
      });

      xhr.open("GET", url);
      xhr.send();
    });
  }

  private createAnalyzer(options: WaveformAudioOptions): WaveformAudio {
    if (this.audio) return this.audio;

    return this.audio = new WaveformAudio(options);
  }

  get sampleRate() {
    return this.audio?.sampleRate ?? 0;
  }
}
