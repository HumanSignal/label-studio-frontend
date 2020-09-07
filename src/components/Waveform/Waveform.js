import CursorPlugin from "wavesurfer.js/dist/plugin/wavesurfer.cursor";
import React from "react";
import ReactDOM from "react-dom";
import throttle from "lodash.throttle";
import { ZoomInOutlined, ZoomOutOutlined } from "@ant-design/icons";
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js";
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js";
import WaveSurfer from "wavesurfer.js";
import styles from "./Waveform.module.scss";
import globalStyles from "../../styles/global.module.scss";
import { Slider, Row, Col, Select } from "antd";
import { SoundOutlined } from "@ant-design/icons";
import InfoModal from "../Infomodal/Infomodal";

/**
 * Use formatTimeCallback to style the notch labels as you wish, such
 * as with more detail as the number of pixels per second increases.
 *
 * Here we format as M:SS.frac, with M suppressed for times < 1 minute,
 * and frac having 0, 1, or 2 digits as the zoom increases.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override timeInterval, primaryLabelInterval and/or
 * secondaryLabelInterval so they all work together.
 *
 * @param: seconds
 * @param: pxPerSec
 */
function formatTimeCallback(seconds, pxPerSec) {
  seconds = Number(seconds);
  var minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;

  // fill up seconds with zeroes
  var secondsStr = Math.round(seconds).toString();
  if (pxPerSec >= 25 * 10) {
    secondsStr = seconds.toFixed(2);
  } else if (pxPerSec >= 25 * 1) {
    secondsStr = seconds.toFixed(1);
  }

  if (minutes > 0) {
    if (seconds < 10) {
      secondsStr = "0" + secondsStr;
    }
    return `${minutes}:${secondsStr}`;
  }
  return secondsStr;
}

/**
 * Use timeInterval to set the period between notches, in seconds,
 * adding notches as the number of pixels per second increases.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override formatTimeCallback, primaryLabelInterval
 * and/or secondaryLabelInterval so they all work together.
 *
 * @param: pxPerSec
 */
function timeInterval(pxPerSec) {
  var retval = 1;
  if (pxPerSec >= 25 * 100) {
    retval = 0.01;
  } else if (pxPerSec >= 25 * 40) {
    retval = 0.025;
  } else if (pxPerSec >= 25 * 10) {
    retval = 0.1;
  } else if (pxPerSec >= 25 * 4) {
    retval = 0.25;
  } else if (pxPerSec >= 25) {
    retval = 1;
  } else if (pxPerSec * 5 >= 25) {
    retval = 5;
  } else if (pxPerSec * 15 >= 25) {
    retval = 15;
  } else {
    retval = Math.ceil(0.5 / pxPerSec) * 60;
  }
  return retval;
}

/**
 * Return the cadence of notches that get labels in the primary color.
 * EG, return 2 if every 2nd notch should be labeled,
 * return 10 if every 10th notch should be labeled, etc.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override formatTimeCallback, primaryLabelInterval
 * and/or secondaryLabelInterval so they all work together.
 *
 * @param pxPerSec
 */
function primaryLabelInterval(pxPerSec) {
  var retval = 1;
  if (pxPerSec >= 25 * 100) {
    retval = 10;
  } else if (pxPerSec >= 25 * 40) {
    retval = 4;
  } else if (pxPerSec >= 25 * 10) {
    retval = 10;
  } else if (pxPerSec >= 25 * 4) {
    retval = 4;
  } else if (pxPerSec >= 25) {
    retval = 1;
  } else if (pxPerSec * 5 >= 25) {
    retval = 5;
  } else if (pxPerSec * 15 >= 25) {
    retval = 15;
  } else {
    retval = Math.ceil(0.5 / pxPerSec) * 60;
  }
  return retval;
}

/**
 * Return the cadence of notches to get labels in the secondary color.
 * EG, return 2 if every 2nd notch should be labeled,
 * return 10 if every 10th notch should be labeled, etc.
 *
 * Secondary labels are drawn after primary labels, so if
 * you want to have labels every 10 seconds and another color labels
 * every 60 seconds, the 60 second labels should be the secondaries.
 *
 * Note that if you override the default function, you'll almost
 * certainly want to override formatTimeCallback, primaryLabelInterval
 * and/or secondaryLabelInterval so they all work together.
 *
 * @param pxPerSec
 */
function secondaryLabelInterval(pxPerSec) {
  // draw one every 10s as an example
  return Math.floor(10 / timeInterval(pxPerSec));
}

export default class Waveform extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      src: this.props.src,
      pos: 0,
      colors: {
        waveColor: "#97A0AF",
        progressColor: "#52c41a",
      },
      zoom: 0,
      speed: 1,
      volume: 1,
    };
  }

  /**
   * Handle to change zoom of wave
   */
  onChangeZoom = value => {
    this.setState({
      ...this.state,
      zoom: value,
    });

    this.wavesurfer.zoom(value);
  };

  onChangeVolume = value => {
    this.setState({
      ...this.state,
      volume: value,
    });

    this.wavesurfer.setVolume(value);
  };

  /**
   * Handle to change speed of wave
   */
  onChangeSpeed = value => {
    this.setState({
      ...this.state,
      speed: value,
    });

    this.wavesurfer.setPlaybackRate(value);
  };

  onZoomPlus = (ev, step = 10) => {
    let val = this.state.zoom;
    val = val + step;
    if (val > 700) val = 700;

    this.onChangeZoom(val);
    ev && ev.preventDefault();
    return false;
  };

  onZoomMinus = (ev, step = 10) => {
    let val = this.state.zoom;
    val = val - step;
    if (val < 0) val = 0;

    this.onChangeZoom(val);
    ev.preventDefault();
    return false;
  };

  onWheel = e => {
    if (e && !e.shiftKey) {
      return;
    } else if (e && e.shiftKey) {
      /**
       * Disable scrolling page
       */
      e.preventDefault();
    }

    const step = e.deltaY > 0 ? 5 : -5;
    // console.log(e.evt.deltaY);
    this.onZoomPlus(e, step);
  };

  componentDidMount() {
    this.$el = ReactDOM.findDOMNode(this);

    this.$waveform = this.$el.querySelector("#wave");

    let wavesurferConfigure = {
      container: this.$waveform,
      waveColor: this.state.colors.waveColor,
      height: this.props.height,
      backend: "MediaElement",
      progressColor: this.state.colors.progressColor,

      splitChannels: true,
    };

    if (this.props.regions) {
      wavesurferConfigure = {
        ...wavesurferConfigure,
        plugins: [
          RegionsPlugin.create({
            dragSelection: {
              slop: 5, // slop
            },
          }),
          TimelinePlugin.create({
            container: "#timeline", // the element in which to place the timeline, or a CSS selector to find it
            formatTimeCallback: formatTimeCallback, // custom time format callback. (Function which receives number of seconds and returns formatted string)
            timeInterval: timeInterval, // number of intervals that records consists of. Usually it is equal to the duration in minutes. (Integer or function which receives pxPerSec value and returns value)
            primaryLabelInterval: primaryLabelInterval, // number of primary time labels. (Integer or function which receives pxPerSec value and reurns value)
            secondaryLabelInterval: secondaryLabelInterval, // number of secondary time labels (Time labels between primary labels, integer or function which receives pxPerSec value and reurns value).
            primaryColor: "blue", // the color of the modulo-ten notch lines (e.g. 10sec, 20sec). The default is '#000'.
            secondaryColor: "blue", // the color of the non-modulo-ten notch lines. The default is '#c0c0c0'.
            primaryFontColor: "#000", // the color of the non-modulo-ten time labels (e.g. 10sec, 20sec). The default is '#000'.
            secondaryFontColor: "#000",
          }),
          CursorPlugin.create({
            wrapper: this.$waveform,
            showTime: true,
            opacity: 1,
          }),
        ],
      };
    }

    this.wavesurfer = WaveSurfer.create(wavesurferConfigure);

    this.wavesurfer.on("error", e => {
      // just general error message
      let body = (
        <p>
          Error while loading audio. Check the <code>data</code> field in task
        </p>
      );

      if (e.message && e.message.includes("fetch")) {
        // "Failed to fetch"
        const urlCORS = "https://labelstud.io/guide/FAQ.html#Image-audio-resource-loading-error-while-labeling";
        /* eslint-disable react/jsx-no-target-blank */
        body = (
          <p>
            Failed to load audio. You can check exact error in Network panel of browser's devtools.
            <br />
            If this related to CORS, check out our{" "}
            <a target="_blank" href={urlCORS}>
              CORS related doc page
            </a>
            .
          </p>
        );
        /* eslint-enable react/jsx-no-target-blank */
      } else if (typeof e === "string" && e.includes("media element")) {
        // "Error loading media element"
        body = "Error while processing audio. Check media format and availability.";
      }

      InfoModal.error(body, e.message || e);
    });

    /**
     * Load data
     */
    this.wavesurfer.load(this.props.src);

    /**
     * Speed of waveform
     */
    this.wavesurfer.setPlaybackRate(this.state.speed);

    const self = this;

    if (this.props.regions) {
      /**
       * Mouse enter on region
       */
      this.wavesurfer.on("region-mouseenter", reg => {
        reg._region.onMouseOver();
      });

      /**
       * Mouse leave on region
       */
      this.wavesurfer.on("region-mouseleave", reg => {
        reg._region.onMouseLeave();
      });

      /**
       * Add region to wave
       */
      this.wavesurfer.on("region-created", reg => {
        const region = self.props.addRegion(reg);
        if (!region) return;

        reg._region = region;
        reg.color = region.selectedregionbg;

        reg.on("click", () => region.onClick(self.wavesurfer));
        reg.on("update-end", () => region.onUpdateEnd(self.wavesurfer));

        reg.on("dblclick", e => {
          window.setTimeout(function() {
            reg.play();
          }, 0);
        });

        reg.on("out", () => {});
      });
    }

    /**
     * Handler of slider
     */
    const slider = document.querySelector("#slider");

    if (slider) {
      slider.oninput = function() {
        self.wavesurfer.zoom(Number(this.value));
      };
    }

    this.wavesurfer.on("ready", () => {
      self.props.onCreate(this.wavesurfer);

      this.wavesurfer.container.onwheel = throttle(this.onWheel, 100);
    });

    /**
     * Pause trigger of audio
     */
    this.wavesurfer.on("pause", self.props.handlePlay);

    /**
     * Play trigger of audio
     */
    this.wavesurfer.on("play", self.props.handlePlay);

    if (this.props.regions) {
      this.props.onLoad(this.wavesurfer);
    }
  }

  render() {
    const self = this;

    const speeds = ["0.5", "1.0", "1.25", "1.5", "2.0"];

    return (
      <div>
        <div id="wave" className={styles.wave} />

        <div id="timeline" />

        {this.props.zoom && (
          <Row gutter={16} style={{ marginTop: "1em" }}>
            <Col flex={12} style={{ textAlign: "right", marginTop: "6px" }}>
              <div style={{ display: "flex" }}>
                <div style={{ marginTop: "6px", marginRight: "5px" }}>
                  <ZoomOutOutlined onClick={this.onZoomMinus} className={globalStyles.link} />
                </div>
                <div style={{ width: "100%" }}>
                  <Slider
                    min={0}
                    step={10}
                    max={500}
                    value={typeof this.state.zoom === "number" ? this.state.zoom : 0}
                    onChange={value => {
                      this.onChangeZoom(value);
                    }}
                  />
                </div>
                <div style={{ marginTop: "6px", marginLeft: "5px" }}>
                  <ZoomInOutlined onClick={this.onZoomPlus} className={globalStyles.link} />
                </div>
              </div>
            </Col>
            <Col flex={3}>
              {this.props.volume && (
                <div style={{ display: "flex", marginTop: "6.5px" }}>
                  <div style={{ width: "100%" }}>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={typeof this.state.volume === "number" ? this.state.volume : 1}
                      onChange={value => {
                        this.onChangeVolume(value);
                      }}
                    />
                  </div>
                  <div style={{ marginLeft: "10px", marginTop: "5px" }}>
                    <SoundOutlined />
                  </div>
                </div>
              )}
            </Col>
            <Col flex={1} style={{ marginTop: "6px" }}>
              {this.props.speed && (
                <Select
                  placeholder="Speed"
                  style={{ width: "100%" }}
                  defaultValue={this.state.speed}
                  onChange={self.onChangeSpeed}
                >
                  {speeds.map(speed => (
                    <Select.Option value={+speed} key={speed}>
                      Speed {speed}
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Col>
          </Row>
        )}
      </div>
    );
  }
}
