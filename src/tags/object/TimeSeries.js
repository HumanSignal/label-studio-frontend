import React, { Fragment } from "react";
import { Button, Icon } from "antd";
import { observer, inject } from "mobx-react";
import { types, getRoot } from "mobx-state-tree";
import { Slider } from "antd";

/**
 *  Copyright (c) 2015, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/* eslint max-len:0 */
/* eslint-disable react/prefer-es6-class */

import "moment-duration-format";
import moment from "moment";
import { format } from "d3-format";
import _ from "underscore";

// Pond
import { TimeSeries, TimeRange, avg, percentile, median } from "pondjs";

// Imports from the charts library

import {
  AreaChart,
  Baseline,
  BoxChart,
  Brush,
  ChartContainer,
  ChartRow,
  Charts,
  LabelAxis,
  LineChart,
  Resizable,
  ValueAxis,
  YAxis,
  styler,
  Legend,
} from "react-timeseries-charts";

//
// Load our data file
//

// Styling relates a channel to its rendering properties. In this way you
// can achieve consistent styles across different charts and labels by supplying
// the components with this styler object

import {
  AbstractSeries,
  Borders,
  DiscreteColorLegend,
  HorizontalGridLines,
  LineSeries,
  ScaleUtils,
  VerticalGridLines,
  XAxis,
  XYPlot,
  //    YAxis,
} from "react-vis";

import Registry from "../../core/Registry";
import Types from "../../core/Types";
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";
import { runTemplate } from "../../core/Template";
import Tree from "../../core/Tree";

import { TimeSeriesChannelModel, HtxTimeSeriesChannel } from "./TimeSeries/Channel";

/**
 * TimeSeries tag can be used to label time series data
 * @example
 * <View>
 *   <TimeSeries name="video" combineChannels="true">
 *      <TimeSeriesChannel value="$val" />
 *      <TimeSeriesChannel value="$val2" />
 *      <TimeSeriesOverview channel="0" />
 *   </TimeSeries>
 * </View>
 * @param {string} name of the element
 */

const data = require("./bike.json");

const TagAttrs = types.model({
  name: types.maybeNull(types.string),

  multiaxis: types.optional(types.boolean, false), // show channels in the same view
  visibilitycontrols: types.optional(types.boolean, false), // show channel visibility controls

  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model("TimeSeriesModel", {
    id: types.optional(types.identifier, guidGenerator),
    type: "timeseries",
    children: Types.unionArray(["timeserieschannel", "timeseriesoverview", "view"]),
    _value: types.optional(types.string, ""),
  })
  .actions(self => ({
    fromStateJSON(obj, fromModel) {
      if (obj.value.choices) {
        self.completion.names.get(obj.from_name).fromStateJSON(obj);
      }
    },

    updateValue(store) {
      self._value = runTemplate(self.value, store.task.dataObj);
    },

    onHotKey() {
      // return self._ws.playPause();
    },
  }));

const totalValues = 10000;

/**
 * Get the array of x and y pairs.
 * The function tries to avoid too large changes of the chart.
 * @param {number} total Total number of values.
 * @returns {Array} Array of data.
 * @private
 */
function getRandomSeriesData(total) {
  const result = [];
  let lastY = Math.random() * 40 - 20;
  let y;
  const firstY = lastY;
  for (let i = 0; i < total; i++) {
    y = Math.random() * firstY - firstY / 2 + lastY;
    result.push({
      x: i,
      y,
    });
    lastY = y;
  }
  return result;
}

class CustomAxisLabel extends React.PureComponent {
  render() {
    const yLabelOffset = {
      y: this.props.marginTop + this.props.innerHeight / 2 + this.props.title.length * 2,
      x: 10,
    };

    const xLabelOffset = {
      x: this.props.marginLeft + this.props.innerWidth / 2 - this.props.title.length * 2,
      y: 1.2 * this.props.innerHeight,
    };

    const transform = this.props.xAxis
      ? `translate(${xLabelOffset.x}, ${xLabelOffset.y})`
      : `translate(${yLabelOffset.x}, ${yLabelOffset.y}) rotate(-90)`;

    return (
      <g transform={transform}>
        <text className="unselectable axis-labels">{this.props.title}</text>
      </g>
    );
  }
}

CustomAxisLabel.displayName = "CustomAxisLabel";
CustomAxisLabel.requiresSVG = true;

class Highlight extends AbstractSeries {
  static displayName = "HighlightOverlay";
  static defaultProps = {
    allow: "x",
    color: "rgb(77, 182, 172)",
    opacity: 0.3,
  };

  state = {
    drawing: false,
    drawArea: { top: 0, right: 0, bottom: 0, left: 0 },
    x_start: 0,
    y_start: 0,
    x_mode: false,
    y_mode: false,
    xy_mode: false,
  };

  constructor(props) {
    super(props);
    document.addEventListener(
      "mouseup",
      function(e) {
        this.stopDrawing();
      }.bind(this),
    );
  }

  _cropDimension(loc, startLoc, minLoc, maxLoc) {
    if (loc < startLoc) {
      return {
        start: Math.max(loc, minLoc),
        stop: startLoc,
      };
    }

    return {
      stop: Math.min(loc, maxLoc),
      start: startLoc,
    };
  }

  _getDrawArea(loc) {
    const { innerWidth, innerHeight } = this.props;
    const { x_mode, y_mode, xy_mode } = this.state;
    const { drawArea, x_start, y_start } = this.state;
    const { x, y } = loc;
    let out = drawArea;

    if (x_mode | xy_mode) {
      // X mode or XY mode
      const { start, stop } = this._cropDimension(x, x_start, 0, innerWidth);
      out = {
        ...out,
        left: start,
        right: stop,
      };
    }
    if (y_mode | xy_mode) {
      // Y mode or XY mode
      const { start, stop } = this._cropDimension(y, y_start, 0, innerHeight);
      out = {
        ...out,
        top: innerHeight - start,
        bottom: innerHeight - stop,
      };
    }
    return out;
  }

  onParentMouseDown(e) {
    const { innerHeight, innerWidth, onBrushStart } = this.props;
    const { x, y } = this._getMousePosition(e);
    const y_rect = innerHeight - y;

    // Define zoom mode
    if ((x < 0) & (y >= 0)) {
      // Y mode
      this.setState({
        y_mode: true,
        drawing: true,
        drawArea: {
          top: y_rect,
          right: innerWidth,
          bottom: y_rect,
          left: 0,
        },
        y_start: y,
      });
    } else if ((x >= 0) & (y < 0)) {
      // X mode
      this.setState({
        x_mode: true,
        drawing: true,
        drawArea: {
          top: innerHeight,
          right: x,
          bottom: 0,
          left: x,
        },
        x_start: x,
      });
    } else if ((x >= 0) & (y >= 0)) {
      // XY mode
      this.setState({
        xy_mode: true,
        drawing: true,
        drawArea: {
          top: y_rect,
          right: x,
          bottom: y_rect,
          left: x,
        },
        x_start: x,
        y_start: y,
      });
    }

    // onBrushStart callback
    if (onBrushStart) {
      onBrushStart(e);
    }
  }

  stopDrawing() {
    // Reset zoom state
    this.setState({
      x_mode: false,
      y_mode: false,
      xy_mode: false,
    });

    // Quickly short-circuit if the user isn't drawing in our component
    if (!this.state.drawing) {
      return;
    }

    const { onBrushEnd } = this.props;
    const { drawArea } = this.state;
    const xScale = ScaleUtils.getAttributeScale(this.props, "x");
    const yScale = ScaleUtils.getAttributeScale(this.props, "y");

    // Clear the draw area
    this.setState({
      drawing: false,
      drawArea: { top: 0, right: 0, bottom: 0, left: 0 },
      x_start: 0,
      y_start: 0,
    });

    // Invoke the callback with null if the selected area was < 5px
    if (Math.abs(drawArea.right - drawArea.left) < 5) {
      onBrushEnd(null);
      return;
    }

    // Compute the corresponding domain drawn
    const domainArea = {
      bottom: yScale.invert(drawArea.top),
      right: xScale.invert(drawArea.right),
      top: yScale.invert(drawArea.bottom),
      left: xScale.invert(drawArea.left),
    };

    if (onBrushEnd) {
      onBrushEnd(domainArea);
    }
  }

  _getMousePosition(e) {
    // Get graph size
    const { marginLeft, marginTop, innerHeight } = this.props;

    // Compute position in pixels relative to axis
    const loc_x = e.nativeEvent.offsetX - marginLeft;
    const loc_y = innerHeight + marginTop - e.nativeEvent.offsetY;

    // Return (x, y) coordinates
    return {
      x: loc_x,
      y: loc_y,
    };
  }

  onParentMouseMove(e) {
    const { drawing } = this.state;

    if (drawing) {
      const pos = this._getMousePosition(e);
      const newDrawArea = this._getDrawArea(pos);
      this.setState({ drawArea: newDrawArea });
    }
  }

  render() {
    const { marginLeft, marginTop, innerWidth, innerHeight, color, opacity } = this.props;
    const {
      drawArea: { left, right, top, bottom },
    } = this.state;
    return (
      <g transform={`translate(${marginLeft}, ${marginTop})`} className="highlight-container">
        <rect className="mouse-target" fill="black" opacity="0" x={0} y={0} width={innerWidth} height={innerHeight} />
        <rect
          className="highlight"
          pointerEvents="none"
          opacity={opacity}
          fill={color}
          x={left}
          y={bottom}
          width={right - left}
          height={top - bottom}
        />
      </g>
    );
  }
}

class TSSlider extends React.Component {
  render() {
    return <Slider />;
  }
}

class HtxTimeSeriesView extends React.Component {
  state = {
    lastDrawLocation: null,
    series: [
      {
        title: "Apples",
        disabled: false,
        data: getRandomSeriesData(totalValues),
      },
      {
        title: "Bananas",
        disabled: false,
        data: getRandomSeriesData(totalValues),
      },
    ],
  };

  render() {
    const { series, lastDrawLocation } = this.state;
    const { item } = this.props;

    return (
      <div className="example-with-click-me">
        {Tree.renderChildren(item)}

        <div className="legend">
          <DiscreteColorLegend width={180} items={series} />
        </div>

        <div
          className="chart no-select"
          onDragStart={function(e) {
            e.preventDefault();
          }}
        >
          <XYPlot
            xDomain={lastDrawLocation && [lastDrawLocation.left, lastDrawLocation.right]}
            yDomain={lastDrawLocation && [lastDrawLocation.bottom, lastDrawLocation.top]}
            height={300}
            width={600}
            margin={{ left: 45, right: 20, top: 10, bottom: 45 }}
          >
            <HorizontalGridLines />
            <VerticalGridLines />

            {series.map(entry => (
              <LineSeries key={entry.title} data={entry.data} />
            ))}

            <Highlight
              onBrushEnd={area => {
                // this.setState(
                //   { lastDrawLocation: area }
                // )
              }}
            />
            <Borders style={{ all: { fill: "#fff" } }} />
            <XAxis tickFormat={v => <tspan className="unselectable"> {v} </tspan>} />
            <YAxis tickFormat={v => <tspan className="unselectable"> {v} </tspan>} />
            <CustomAxisLabel title={"Time [s]"} xAxis />
            <CustomAxisLabel title={"Value [-]"} />
          </XYPlot>

          <TSSlider />
        </div>
      </div>
    );
  }
}

const style = styler([
  { key: "distance", color: "#e2e2e2" },
  { key: "altitude", color: "#e2e2e2" },
  { key: "cadence", color: "#ff47ff" },
  { key: "power", color: "green", width: 1, opacity: 0.5 },
  { key: "temperature", color: "#cfc793" },
  { key: "speed", color: "steelblue", width: 1, opacity: 0.5 },
]);

// Baselines are the dotted average lines displayed on the chart
// In this case these are separately styled

const baselineStyles = {
  speed: {
    stroke: "steelblue",
    opacity: 0.5,
    width: 0.25,
  },
  power: {
    stroke: "green",
    opacity: 0.5,
    width: 0.25,
  },
};

// d3 formatter to display the speed with one decimal place
const speedFormat = format(".1f");

class HtxTimeSeriesViewRTS extends React.Component {
  constructor(props) {
    super(props);
    const initialRange = new TimeRange([75 * 60 * 1000, 125 * 60 * 1000]);

    // Storage for all the data channels
    const channels = {
      distance: {
        units: "miles",
        label: "Distance",
        format: ",.1f",
        series: null,
        show: false,
      },
      altitude: { units: "feet", label: "Altitude", format: "d", series: null, show: false },
      cadence: { units: "rpm", label: "Cadence", format: "d", series: null, show: true },
      power: { units: "watts", label: "Power", format: ",.1f", series: null, show: true },
      temperature: { units: "deg F", label: "Temp", format: "d", series: null, show: false },
      speed: { units: "mph", label: "Speed", format: ",.1f", series: null, show: true },
    };

    // Channel names list, in order we want them shown
    const channelNames = ["speed", "power", "cadence", "temperature", "distance", "altitude"];

    // Channels we'll actually display on our charts
    const displayChannels = ["speed", "power", "cadence"];

    // Rollups we'll generate to reduce data for the screen
    const rollupLevels = ["1s", "5s", "15s", "25s"];

    this.state = {
      ready: false,
      mode: "channels",
      channels,
      channelNames,
      displayChannels,
      rollupLevels,
      rollup: "1m",
      tracker: null,
      timerange: initialRange,
      brushrange: initialRange,
    };
  }

  componentDidMount() {
    setTimeout(() => {
      const { channelNames, channels, displayChannels, rollupLevels } = this.state;

      //
      // Process the data file into channels
      //

      const points = {};
      channelNames.forEach(channel => {
        points[channel] = [];
      });

      for (let i = 0; i < data.time.length; i += 1) {
        if (i > 0) {
          const deltaTime = data.time[i] - data.time[i - 1];
          const time = data.time[i] * 1000;

          points["distance"].push([time, data.distance[i]]);
          points["altitude"].push([time, data.altitude[i] * 3.28084]); // convert m to ft
          points["cadence"].push([time, data.cadence[i]]);
          points["power"].push([time, data.watts[i]]);
          points["temperature"].push([time, data.temp[i]]);

          // insert a null into the speed data to put breaks in the data where
          // the rider was stationary
          if (deltaTime > 10) {
            points["speed"].push([time - 1000, null]);
          }

          const speed = (data.distance[i] - data.distance[i - 1]) / (data.time[i] - data.time[i - 1]); // meters/sec
          points["speed"].push([time, 2.236941 * speed]); // convert m/s to miles/hr
        }
      }

      // Make the TimeSeries here from the points collected above
      for (let channelName of channelNames) {
        // The TimeSeries itself, for this channel
        const series = new TimeSeries({
          name: channels[channelName].name,
          columns: ["time", channelName],
          points: points[channelName],
        });

        if (_.contains(displayChannels, channelName)) {
          const rollups = _.map(rollupLevels, rollupLevel => {
            return {
              duration: parseInt(rollupLevel.split("s")[0], 10),
              series: series.fixedWindowRollup({
                windowSize: rollupLevel,
                aggregation: { [channelName]: { [channelName]: avg() } },
              }),
            };
          });

          // Rollup series levels
          channels[channelName].rollups = rollups;
        }

        // Raw series
        channels[channelName].series = series;

        // Some simple statistics for each channel
        channels[channelName].avg = parseInt(series.avg(channelName), 10);
        channels[channelName].max = parseInt(series.max(channelName), 10);
      }

      // Min and max time constraints for pan/zoom, along with the smallest timerange
      // the user can zoom into. These are passed into the ChartContainers when we come to
      // rendering.

      const minTime = channels.altitude.series.range().begin();
      const maxTime = channels.altitude.series.range().end();
      const minDuration = 10 * 60 * 1000;

      this.setState({ ready: true, channels, minTime, maxTime, minDuration });
    }, 0);
  }

  handleTrackerChanged = t => {
    this.setState({ tracker: t });
  };

  // Handles when the brush changes the timerange
  handleTimeRangeChange = timerange => {
    const { channels } = this.state;

    if (timerange) {
      this.setState({ timerange, brushrange: timerange });
    } else {
      this.setState({ timerange: channels["altitude"].range(), brushrange: null });
    }
  };

  handleChartResize = width => {
    this.setState({ width });
  };

  handleActiveChange = channelName => {
    const channels = this.state.channels;
    channels[channelName].show = !channels[channelName].show;
    this.setState({ channels });
  };

  renderChart = () => {
    if (this.state.mode === "multiaxis") {
      return this.renderMultiAxisChart();
    } else if (this.state.mode === "channels") {
      return this.renderChannelsChart();
    } else if (this.state.mode === "rollup") {
      return this.renderBoxChart();
    }
    return <div>No chart</div>;
  };

  renderChannelsChart = () => {
    const { timerange, displayChannels, channels, maxTime, minTime, minDuration } = this.state;

    const durationPerPixel = timerange.duration() / 800 / 1000;
    const rows = [];

    for (let channelName of displayChannels) {
      const charts = [];
      let series = channels[channelName].series;
      _.forEach(channels[channelName].rollups, rollup => {
        if (rollup.duration < durationPerPixel * 2) {
          series = rollup.series.crop(timerange);
        }
      });

      charts.push(
        <LineChart
          key={`line-${channelName}`}
          axis={`${channelName}_axis`}
          series={series}
          columns={[channelName]}
          style={style}
          breakLine
        />,
      );
      charts.push(
        <Baseline
          key={`baseline-${channelName}`}
          axis={`${channelName}_axis`}
          style={baselineStyles.speed}
          value={channels[channelName].avg}
        />,
      );

      // Get the value at the current tracker position for the ValueAxis
      let value = "--";
      if (this.state.tracker) {
        const approx = (+this.state.tracker - +timerange.begin()) / (+timerange.end() - +timerange.begin());
        const ii = Math.floor(approx * series.size());
        const i = series.bisect(new Date(this.state.tracker), ii);
        const v = i < series.size() ? series.at(i).get(channelName) : null;
        if (v) {
          value = parseInt(v, 10);
        }
      }

      // Get the summary values for the LabelAxis
      const summary = [
        { label: "Max", value: speedFormat(channels[channelName].max) },
        { label: "Avg", value: speedFormat(channels[channelName].avg) },
      ];

      rows.push(
        <ChartRow height="100" visible={channels[channelName].show} key={`row-${channelName}`}>
          <LabelAxis
            id={`${channelName}_axis`}
            label={channels[channelName].label}
            values={summary}
            min={0}
            max={channels[channelName].max}
            width={140}
            type="linear"
            format=",.1f"
          />
          <Charts>{charts}</Charts>
          <ValueAxis
            id={`${channelName}_valueaxis`}
            value={value}
            detail={channels[channelName].units}
            width={80}
            min={0}
            max={35}
          />
        </ChartRow>,
      );
    }

    return (
      <ChartContainer
        timeRange={this.state.timerange}
        format="relative"
        showGrid={false}
        enablePanZoom
        maxTime={maxTime}
        minTime={minTime}
        minDuration={minDuration}
        trackerPosition={this.state.tracker}
        onTimeRangeChanged={this.handleTimeRangeChange}
        onChartResize={width => this.handleChartResize(width)}
        onTrackerChanged={this.handleTrackerChanged}
      >
        {rows}
      </ChartContainer>
    );
  };

  renderBoxChart = () => {
    const { timerange, displayChannels, channels, maxTime, minTime, minDuration } = this.state;

    const rows = [];

    for (let channelName of displayChannels) {
      const charts = [];
      const series = channels[channelName].series;

      charts.push(
        <BoxChart
          key={`box-${channelName}`}
          axis={`${channelName}_axis`}
          series={series}
          column={channelName}
          style={style}
          aggregation={{
            size: this.state.rollup,
            reducers: {
              outer: [percentile(5), percentile(95)],
              inner: [percentile(25), percentile(75)],
              center: median(),
            },
          }}
        />,
      );
      charts.push(
        <Baseline
          key={`baseline-${channelName}`}
          axis={`${channelName}_axis`}
          style={baselineStyles.speed}
          value={channels[channelName].avg}
        />,
      );

      // Get the value at the current tracker position for the ValueAxis
      let value = "--";
      if (this.state.tracker) {
        const approx = (+this.state.tracker - +timerange.begin()) / (+timerange.end() - +timerange.begin());
        const ii = Math.floor(approx * series.size());
        const i = series.bisect(new Date(this.state.tracker), ii);
        const v = i < series.size() ? series.at(i).get(channelName) : null;
        if (v) {
          value = parseInt(v, 10);
        }
      }

      // Get the summary values for the LabelAxis
      const summary = [
        { label: "Max", value: speedFormat(channels[channelName].max) },
        { label: "Avg", value: speedFormat(channels[channelName].avg) },
      ];

      rows.push(
        <ChartRow height="100" visible={channels[channelName].show} key={`row-${channelName}`}>
          <LabelAxis
            id={`${channelName}_axis`}
            label={channels[channelName].label}
            values={summary}
            min={0}
            max={channels[channelName].max}
            width={140}
            type="linear"
            format=",.1f"
          />
          <Charts>{charts}</Charts>
          <ValueAxis
            id={`${channelName}_valueaxis`}
            value={value}
            detail={channels[channelName].units}
            width={80}
            min={0}
            max={35}
          />
        </ChartRow>,
      );
    }

    return (
      <ChartContainer
        timeRange={this.state.timerange}
        format="relative"
        showGrid={false}
        enablePanZoom
        maxTime={maxTime}
        minTime={minTime}
        minDuration={minDuration}
        trackerPosition={this.state.tracker}
        onTimeRangeChanged={this.handleTimeRangeChange}
        onChartResize={width => this.handleChartResize(width)}
        onTrackerChanged={this.handleTrackerChanged}
      >
        {rows}
      </ChartContainer>
    );
  };

  renderMultiAxisChart() {
    const { timerange, displayChannels, channels, maxTime, minTime, minDuration } = this.state;

    const durationPerPixel = timerange.duration() / 800 / 1000;

    // Line charts
    const charts = [];
    for (let channelName of displayChannels) {
      let series = channels[channelName].series;
      _.forEach(channels[channelName].rollups, rollup => {
        if (rollup.duration < durationPerPixel * 2) {
          series = rollup.series.crop(timerange);
        }
      });

      charts.push(
        <LineChart
          key={`line-${channelName}`}
          axis={`${channelName}_axis`}
          visible={channels[channelName].show}
          series={series}
          columns={[channelName]}
          style={style}
          breakLine
        />,
      );
    }

    // Tracker info box
    const trackerInfoValues = displayChannels
      .filter(channelName => channels[channelName].show)
      .map(channelName => {
        const fmt = format(channels[channelName].format);

        let series = channels[channelName].series.crop(timerange);

        let v = "--";
        if (this.state.tracker) {
          const i = series.bisect(new Date(this.state.tracker));
          const vv = series.at(i).get(channelName);
          if (vv) {
            v = fmt(vv);
          }
        }

        const label = channels[channelName].label;
        const value = `${v} ${channels[channelName].units}`;

        return { label, value };
      });

    // Axis list
    const axisList = [];
    for (let channelName of displayChannels) {
      const label = channels[channelName].label;
      const max = channels[channelName].max;
      const format = channels[channelName].format;
      const id = `${channelName}_axis`;
      const visible = channels[channelName].show;
      axisList.push(
        <YAxis
          id={id}
          key={id}
          visible={visible}
          label={label}
          min={0}
          max={max}
          width={70}
          type="linear"
          format={format}
        />,
      );
    }

    return (
      <ChartContainer
        timeRange={this.state.timerange}
        format="relative"
        trackerPosition={this.state.tracker}
        onTrackerChanged={this.handleTrackerChanged}
        trackerShowTime
        enablePanZoom
        maxTime={maxTime}
        minTime={minTime}
        minDuration={minDuration}
        onTimeRangeChanged={this.handleTimeRangeChange}
      >
        <ChartRow
          height="200"
          trackerInfoValues={trackerInfoValues}
          trackerInfoHeight={10 + trackerInfoValues.length * 16}
          trackerInfoWidth={140}
        >
          {axisList}
          <Charts>{charts}</Charts>
        </ChartRow>
      </ChartContainer>
    );
  }

  renderBrush = () => {
    const { channels } = this.state;
    return (
      <ChartContainer
        timeRange={channels.altitude.series.range()}
        format="relative"
        trackerPosition={this.state.tracker}
      >
        <ChartRow height="100" debug={false}>
          <Brush
            timeRange={this.state.brushrange}
            allowSelectionClear
            onTimeRangeChanged={this.handleTimeRangeChange}
          />
          <YAxis
            id="axis1"
            label="Altitude (ft)"
            min={0}
            max={channels.altitude.max}
            width={70}
            type="linear"
            format="d"
          />
          <Charts>
            <AreaChart
              axis="axis1"
              style={style.areaChartStyle()}
              columns={{ up: ["altitude"], down: [] }}
              series={channels.altitude.series}
            />
          </Charts>
        </ChartRow>
      </ChartContainer>
    );
  };

  renderMode = () => {
    const linkStyle = {
      fontWeight: 600,
      color: "grey",
      cursor: "default",
    };

    const linkStyleActive = {
      color: "steelblue",
      cursor: "pointer",
    };

    return (
      <div className="col-md-6" style={{ fontSize: 14, color: "#777" }}>
        <span
          style={this.state.mode !== "multiaxis" ? linkStyleActive : linkStyle}
          onClick={() => this.setState({ mode: "multiaxis" })}
        >
          Multi-axis
        </span>
        <span> | </span>
        <span
          style={this.state.mode !== "channels" ? linkStyleActive : linkStyle}
          onClick={() => this.setState({ mode: "channels" })}
        >
          Channels
        </span>
        <span> | </span>
        <span
          style={this.state.mode !== "rollup" ? linkStyleActive : linkStyle}
          onClick={() => this.setState({ mode: "rollup" })}
        >
          Rollups
        </span>
      </div>
    );
  };

  renderModeOptions = () => {
    const linkStyle = {
      fontWeight: 600,
      color: "grey",
      cursor: "default",
    };

    const linkStyleActive = {
      color: "steelblue",
      cursor: "pointer",
    };

    if (this.state.mode === "multiaxis") {
      return <div />;
    } else if (this.state.mode === "channels") {
      return <div />;
    } else if (this.state.mode === "rollup") {
      return (
        <div className="col-md-6" style={{ fontSize: 14, color: "#777" }}>
          <span
            style={this.state.rollup !== "1m" ? linkStyleActive : linkStyle}
            onClick={() => this.setState({ rollup: "1m" })}
          >
            1m
          </span>
          <span> | </span>
          <span
            style={this.state.rollup !== "5m" ? linkStyleActive : linkStyle}
            onClick={() => this.setState({ rollup: "5m" })}
          >
            5m
          </span>
          <span> | </span>
          <span
            style={this.state.rollup !== "15m" ? linkStyleActive : linkStyle}
            onClick={() => this.setState({ rollup: "15m" })}
          >
            15m
          </span>
        </div>
      );
    }
    return <div />;
  };

  render() {
    const { ready, channels, displayChannels } = this.state;

    if (!ready) {
      return <div>{`Building rollups...`}</div>;
    }
    const chartStyle = {
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "#DDD",
      paddingTop: 10,
      marginBottom: 10,
    };

    const brushStyle = {
      boxShadow: "inset 0px 2px 5px -2px rgba(189, 189, 189, 0.75)",
      background: "#FEFEFE",
      paddingTop: 10,
    };

    // Generate the legend
    const legend = displayChannels.map(channelName => ({
      key: channelName,
      label: channels[channelName].label,
      disabled: !channels[channelName].show,
    }));

    return (
      <div>
        <div className="row">
          {this.renderMode()}
          {this.renderModeOptions()}
        </div>
        <div className="row">
          <div className="col-md-12">
            <hr />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <Legend
              type={this.state.mode === "rollup" ? "swatch" : "line"}
              style={style}
              categories={legend}
              onSelectionChange={this.handleActiveChange}
            />
          </div>

          <div className="col-md-6">
            {this.state.tracker ? `${moment.duration(+this.state.tracker).format()}` : "-:--:--"}
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <hr />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12" style={chartStyle}>
            <Resizable>{ready ? this.renderChart() : <div>Loading.....</div>}</Resizable>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12" style={brushStyle}>
            <Resizable>{ready ? this.renderBrush() : <div />}</Resizable>
          </div>
        </div>
      </div>
    );
  }
}

const TimeSeriesModel = types.compose("TimeSeriesModel", TagAttrs, Model);
const HtxTimeSeries = inject("store")(observer(HtxTimeSeriesViewRTS));

Registry.addTag("timeseries", TimeSeriesModel, HtxTimeSeries);

export { TimeSeriesModel, HtxTimeSeries };
