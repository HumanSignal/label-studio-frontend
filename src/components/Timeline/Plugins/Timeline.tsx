import BaseTimelinePlugin, { TimelinePluginParams as BaseTimelinePluginParams } from "wavesurfer.js/src/plugin/timeline";

export interface TimelinePluginParams extends BaseTimelinePluginParams {
  labelPlacement?: "top" | "right";
}

export class TimelinePlugin extends BaseTimelinePlugin {
  static create(params: any) {
    return {
      name: 'timeline',
      deferInit: params && params.deferInit ? params.deferInit : false,
      params,
      instance: TimelinePlugin,
    } as any;
  }

  constructor(params: TimelinePluginParams, ws: WaveSurfer) {
    super(params, ws);
    this.initParams(params);
  }

  get wrapperHeight() {
    const { fontSize, height, labelPadding } = this.params as any;

    return fontSize + height + labelPadding * 2;
  }

  initParams(params: TimelinePluginParams) {
    (this.params as any) = Object.assign(
      this.params,
      {
        height: 10,
        fontSize: 12,
        labelPadding: 4,
        labelPlacement: "top",
      },
      params,
    );
  }

  createWrapper() {
    const wsParams = this.wavesurfer.params;

    if (this.container instanceof HTMLElement) {
      this.container.innerHTML = '';

      (this.wrapper as any) = this.container.appendChild(
        document.createElement('timeline'),
      );
    }
    if (this.wrapper) {
      this.util.style(this.wrapper, {
        display: 'block',
        position: 'relative',
        userSelect: 'none',
        webkitUserSelect: 'none',
        height: `${this.wrapperHeight}px`,
      });

      if (wsParams.fillParent || wsParams.scrollParent) {
        this.util.style(this.wrapper, {
          width: '100%',
          overflowX: 'hidden',
          overflowY: 'hidden',
        });
      }

      this.wrapper.addEventListener('click', (this as any)._onWrapperClick);
    }
  }

  /**
   * Render the timeline labels and notches
   */
  renderCanvases() {

    const duration =
            this.params.duration ||
            this.wavesurfer.backend.getDuration();

    if (duration <= 0) {
      return;
    }

    const baseFontSize = this.params.fontSize || 12;

    const wsParams = this.wavesurfer.params;
    const fontSize = baseFontSize * wsParams.pixelRatio;
    const totalSeconds = parseInt(duration as any, 10) + 1;

    const width =
            wsParams.fillParent && !wsParams.scrollParent
              ? (this as any).drawer.getWidth()
              : (this as any).drawer.wrapper.scrollWidth * wsParams.pixelRatio;

    const baseHeight = (this.params as any).height;
    const baseOffset = (this.params as any).offset;
    const pxRatio = (this as any).pixelRatio;
    const height1 =  baseHeight * pxRatio;
    const height2 =
            baseHeight *
            ((this.params as any).notchPercentHeight / 100) *
            pxRatio;
    const pixelsPerSecond = width / duration;
    const formatTime = (this.params as any).formatTimeCallback;
    const primaryColor = (this.params as any).primaryColor;
    const primaryFontColor = (this.params as any).primaryFontColor;
    const secondaryColor = (this.params as any).secondaryColor;
    const secondaryFontColor = (this.params as any).secondaryFontColor;
    const unlabeledNotchColor = (this.params as any).unlabeledNotchColor;
    const labelPadding = (this.params as any).labelPadding;

    // if parameter is function, call the function with
    // pixelsPerSecond, otherwise simply take the value as-is
    const intervalFnOrVal = (option: any) =>
      typeof option === 'function' ? option(pixelsPerSecond) : option;
    const timeInterval = intervalFnOrVal(this.params.timeInterval);
    const primaryLabelInterval = intervalFnOrVal(
      this.params.primaryLabelInterval,
    );
    const secondaryLabelInterval = intervalFnOrVal(
      this.params.secondaryLabelInterval,
    );

    let curPixel = pixelsPerSecond * (this.params as any).offset;
    let curSeconds = 0;
    let i;
    // build an array of position data with index, second and pixel data,
    // this is then used multiple times below
    const positioning: any[] = [];

    // render until end in case we have a negative offset
    const renderSeconds = (baseOffset < 0)
      ? totalSeconds - baseOffset 
      : totalSeconds;

    for (i = 0; i < renderSeconds / timeInterval; i++) {
      positioning.push([i, curSeconds, curPixel]);
      curSeconds += timeInterval;
      curPixel += pixelsPerSecond * timeInterval;
    }

    // iterate over each position
    const renderPositions = (cb: (i: number, sec: number, px: number) => any) => {
      positioning.forEach(pos => {
        cb(pos[0], pos[1], pos[2]);
      });
    };

    // render primary labels
    this.setFillStyles(primaryColor);
    this.setFonts(`${fontSize}px ${this.params.fontFamily}`);
    this.setFillStyles(primaryFontColor);
    renderPositions((i: number, curSeconds: number, curPixel: number) => {
      if (i % primaryLabelInterval === 0) {
        this.fillRect(curPixel, 0, 1, height1);
        this.fillText(
          formatTime(curSeconds, pixelsPerSecond),
          curPixel + labelPadding * pxRatio,
          height1,
        );
      }
    });

    // render secondary labels
    this.setFillStyles(secondaryColor);
    this.setFonts(`${fontSize}px ${this.params.fontFamily}`);
    this.setFillStyles(secondaryFontColor);
    renderPositions((i: number, curSeconds: number, curPixel: number) => {
      if (i % secondaryLabelInterval === 0) {
        this.fillRect(curPixel, 0, 1, height1);
        this.fillText(
          formatTime(curSeconds, pixelsPerSecond),
          curPixel + labelPadding * pxRatio,
          height1,
        );
      }
    });

    // render the actual notches (when no labels are used)
    this.setFillStyles(unlabeledNotchColor);
    renderPositions((i: number, curSeconds: number, curPixel: number) => {
      if (
        i % secondaryLabelInterval !== 0 &&
                i % primaryLabelInterval !== 0
      ) {
        this.fillRect(curPixel, 0, 1, height2);
      }
    });
  }
}

