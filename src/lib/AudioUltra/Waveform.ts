import { Events } from "./Common/Events";
import { MediaLoader } from "./Media/MediaLoader";
import { Player } from "./Controls/Player";
import { Tooltip, TooltipOptions } from "./Tooltip/Tooltip";
import { Cursor, CursorOptions, CursorSymbol } from "./Cursor/Cursor";
import { RegionGlobalEvents, RegionOptions } from "./Regions/Region";
import { Visualizer } from "./Visual/Visualizer";
import { Regions, RegionsOptions } from "./Regions/Regions";
import { Timeline, TimelineOptions } from "./Timeline/Timeline";
import { Padding } from "./Common/Style";
import { getCursorTime } from "./Common/Utils";
import { PlayheadOptions } from "./Visual/PlayHead";

export interface WaveformOptions {
  /** URL of an audio or video */
  src: string;

  /** Container to render to */
  container: string | HTMLElement;

  /**
   * Height of the interface. Inferred from the container size
   * @default 110
   * */
  height?: number;

  /**
   * Zoom factor. 1 – no zoom
   * @default 1
   * */
  zoom?: number;

  /**
   * Volume 0..1, 0 – muted
   * @default 1
   * */
  volume?: number;

  /**
   * Muted true/false. Preserves the latest set volume
   * @default false
   * */
  muted?: boolean;

  /**
   * Playback speed rate. 1 – normal speed
   * @default 1
   * */
  rate?: number;

  /**
   * Auto-center the view to the cursor
   * @default false
   * */
  autoCenter?: boolean;

  /**
   * Show channels separately
   * */
  splitChannels?: boolean;

  /**
   * What channels to show
   */
  enabledChannels?: number[];

  /**
   * Center the view to the cursor when zoomin
   * @default false
   */
  zoomToCursor?: boolean;

  /**
   * Color of the grid
   */
  gridColor?: string;

  /**
   * Thickness of the grid
   */
  gridWidth?: number;

  /**
   * Width of the cursor in pixels
   */
  cursorWidth?: number;

  /**
   * Color of the wave
   */
  waveColor?: string;

  /**
   * Color of the progress
   */
  waveProgressColor?: string;

  /**
   * Waveform background color
   */
  backgroundColor?: string;

  /**
   * How to follow the cursor
   * - center - center the view to the cursor
   * - paged - move the view to the cursor
   */
  followCursor?: "center" | "paged" | false;

  // Spectro styles
  // @todo: implement the sepctrogram

  // Other options
  seekStep?: number;

  // Regions
  regions?: RegionsOptions;

  padding?: Padding;

  autoPlayNewSegments?: boolean;

  // Cursor options
  cursor?: CursorOptions;

  // Tooltip options
  tooltip?: TooltipOptions;

  // Playhead options
  playhead?: PlayheadOptions;

  // Timeline options
  timeline?: TimelineOptions;

  /**
   * Experimental features
   */
  experimental?: {
    backgroundCompute: boolean,
    denoize: boolean,
  };
}
interface WaveformEventTypes extends RegionGlobalEvents {
  "load": () => void;
  "resize": (wf: Waveform, width: number, height: number) => void;
  "pause": () => void;
  "play": () => void;
  "playing": (currentTime: number) => void;
  "seek": (currentTime: number) => void;
  "playend": () => void;
  "zoom": (zoom: number) => void;
  "muted": (muted: boolean) => void;
  "volumeChange": (value: number) => void;
  "rateChanged": (value: number) => void;
  "scroll": (scroll: number) => void;
}

export class Waveform extends Events<WaveformEventTypes> {
  private src: string;
  private media!: MediaLoader;
  private visualizer!: Visualizer;
  private timeline!: Timeline;

  tooltip!: Tooltip;
  cursor!: Cursor;
  player!: Player;
  params: WaveformOptions;
  regions!: Regions;
  loaded = false;

  constructor(params: WaveformOptions) {
    super();

    if (!params?.timeline) {
      params.timeline = { placement: "top" };
    }

    this.src = params.src;
    this.params = params;

    this.init();
  }

  private init() {
    this.media = new MediaLoader(this, {
      src: this.src,
    });

    this.tooltip = new Tooltip(this.params?.tooltip);
    this.visualizer = new Visualizer(this.params, this);
    this.cursor = new Cursor({
      x: 0,
      y: 0,
      width: this.params?.cursorWidth ?? 1,
      ...this.params?.cursor,
    }, this.visualizer);
    this.timeline = new Timeline(
      {
        gridColor: this.params.gridColor,
        gridWidth: this.params.gridWidth,
        ...this.params?.timeline,
      },
      this,
      this.visualizer,
    );
    this.regions = new Regions({
      ...this.params?.regions,
    }, this, this.visualizer);

    this.player = new Player(this);

    this.initEvents();
  }

  async load() {
    const audio = await this.media.load({
      muted: this.params.muted ?? false,
      volume: this.params.volume ?? 1,
      rate: this.params.rate ?? 1,
    });

    if (audio) {
      this.player.init(audio);
      this.visualizer.init(audio);
      this.loaded = true;
      this.regions.renderAll();
      this.timeline.render();

      this.invoke("load");
    }
  }

  seek(value: number) {
    this.player.seek(value);
  }

  seekForward(value?: number) {
    this.seek(this.currentTime + (value ?? this.params.seekStep ?? 1));
  }

  seekBackward(value?: number) {
    this.seek(this.currentTime - (value ?? this.params.seekStep ?? 1));
  }

  /**
   * Play the track
   * @param start Optionally defines start of the playback in seconds
   * @param end Optionally defines the end of the playback in seconds
   */
  play(start?: number, end?: number) {
    this.player.play(start, end);
  }

  /**
   * Pause playback
   */
  pause() {
    this.player.pause();
  }

  /**
   * Toggle playback
   */
  togglePlay() {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Stop playback
   */
  stop() {
    this.player.stop();
  }

  /**
   * Detach all the event handlers, cleanup the cache, remove Waveform from the dom
   */
  destroy() {
    this.removeAllListeners();
    this.regions.destroy();
    this.visualizer.destroy();
    this.media.destroy();
    this.cursor.destroy();
    this.tooltip.destroy();
  }

  addRegion(options: RegionOptions, render = true) {
    return this.regions.addRegion(options, render);
  }

  updateRegion(options: RegionOptions, render = true) {
    return this.regions.updateRegion(options, render);
  }

  removeRegion(regionId: string) {
    this.regions.removeRegion(regionId);
  }

  /**
   * Current playback state
   */
  get playing() {
    return this.player.playing;
  }

  /**
   * Sets zoom multiplier 1-150
   * @default 1
   */
  get zoom() {
    return this.visualizer.getZoom();
  }

  set zoom(value: number) {
    this.visualizer.setZoom(value);
  }

  /**
   * Current gain 0..2, 0 is muted
   * @default 1
   */
  get volume() {
    return this.player.volume;
  }

  set volume(value: number) {
    this.player.volume = value;
  }

  /**
   * Mute playback
   */
  get muted() {
    return this.player.muted;
  }

  set muted(value: boolean) {
    this.player.muted = value;
  }

  /**
   * Scroll to a particular second of the track
   * @default 1
   */
  get scroll() {
    return (this.duration * this.visualizer.getScrollLeft()) / this.zoom * 1000;
  }

  set scroll(time: number) {
    const scrollLeft = time / this.duration * this.zoom;
    
    this.visualizer.setScrollLeft(scrollLeft);
    this.invoke("scroll", [scrollLeft]);
  }

  /**
   * Playback speed
   * @default 1
   */
  get rate() {
    return this.player.rate;
  }

  set rate(value: number) {
    this.player.rate = value;
  }

  /**
   * Current playback time in seconds
   */
  get currentTime() {
    return this.player.currentTime;
  }

  set currentTime(value: number) {
    this.player.seek(value);
  }

  /**
   * Waveform amplification factor
   */
  get amp() {
    return this.visualizer.getAmp();
  }

  set amp(value: number) {
    this.visualizer.setAmp(value);
  }

  /**
   * Track duration in seconds
   */
  get duration() {
    return this.player.duration;
  }

  /**
   * Returns audio frequency data
   */
  get sampleRate() {
    return this.media.sampleRate;
  }

  /**
   * Initialize events
   */
  private initEvents() {
    this.cursor.on("mouseMove", this.handleCursorMove);
  }

  /**
   * Handle cursor move event
   */
  private handleCursorMove = (e: MouseEvent) => {
    if (this.loaded && this.cursor.inView) {
      setTimeout(() => {
        if (!this.cursor.hasFocus()) {
          this.cursor.set(CursorSymbol.crosshair);
        }
      });

      const cursorTime = getCursorTime(e, this.visualizer, this.duration);
      const timeDate = new Date(cursorTime * 1000);
      const onlyTime = timeDate.toISOString().match(/T(.*?)Z/)?.[1];
      const { clientX, clientY } = e;

      this.tooltip.show(clientX, clientY - 20, onlyTime);
    } else {
      this.cursor.set(CursorSymbol.default);
      this.tooltip.hide();
    }
  };
}
