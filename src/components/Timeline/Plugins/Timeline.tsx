import BaseTimelinePlugin, { TimelinePluginParams as BaseTimelinePluginParams } from "wavesurfer.js/src/plugin/timeline";

export type TimelinePluginParams = BaseTimelinePluginParams

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
}

