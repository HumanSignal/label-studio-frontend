import "moment-duration-format";
import React from "react";
import _ from "underscore";
import moment from "moment";
import { Button, Icon } from "antd";
import { Slider } from "antd";
import { TimeSeries, TimeRange, avg, percentile, median } from "pondjs";
import { format } from "d3-format";
import { observer, inject } from "mobx-react";
import { types, getParent } from "mobx-state-tree";

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
  TimeMarker,
  MultiBrush,
} from "react-timeseries-charts";

import ObjectBase from "../Base";
import ObjectTag from "../../../components/Tags/Object";
import Registry from "../../../core/Registry";
import Types from "../../../core/Types";
import { guidGenerator, restoreNewsnapshot } from "../../../core/Helpers";
import { runTemplate } from "../../../core/Template";

const data = require("../bike.json");

const TagAttrs = types.model({
  displayname: types.maybeNull(types.string),
  units: types.maybeNull(types.string),
  unitsformat: types.string,
  caption: types.optional(types.boolean, true), // show channel caption view, like channel name, etc

  value: types.maybeNull(types.string),
  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model("TimeSeriesChannelModel", {
    id: types.optional(types.identifier, guidGenerator),
    type: "timeserieschannel",
    children: Types.unionArray(["channel", "view"]),
    // _value: types.optional(types.string, ""),
  })
  .views(self => ({
    get parent() {
      return Types.getParentOfTypeString(self, "TimeSeriesModel");
    },
  }))
  .actions(self => ({
    updateValue(store) {
      console.log("updateValue start");
      self._value = runTemplate(self.value, store.task.dataObj, { raw: true });

      const points = [];
      for (let i = 0; i <= self._value[0].length; i++) {
        points.push([self.parent._value[0][i] * 1000, self._value[0][i]]);
      }

      const series = new TimeSeries({
        columns: ["time", self.value],
        points: points,
      });

      // Some simple statistics for each channel
      self._avg = parseInt(series.avg(self.value), 10);
      self._max = parseInt(series.max(self.value), 10);
      self._series = series;

      self._minTime = series.range().begin();
      self._maxTime = series.range().end();

      // self.parent.updateView();
      // console.log('updateValue end');
    },
  }));

const TimeSeriesChannelModel = types.compose("TimeSeriesChannelModel", Model, TagAttrs, ObjectBase);

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

const HtxTimeSeriesChannelView = observer(({ store, item }) => {
  if (!item._value) return null;

  const u = item.parent._needsUpdate;
  const timerange = item.parent.initialRange;
  const maxTime = item._maxTime;
  const minTime = item._minTime;
  const minDuration = 10 * 60 * 1000;
  const durationPerPixel = timerange.duration() / 800 / 1000;
  const dn = item.displayname;

  const charts = [
    <LineChart
      key={`line-${item.value}-{$u}`}
      axis={`${item.value}_axis`}
      series={item._series}
      interpolation="curveStep"
      columns={[item.value]}
      // style={style}
      breakLine
    />,
    <MultiBrush
      key={`mb-${item.value}-{$u}`}
      timeRanges={item.parent.regionsTimeRanges}
      style={i => {
        let col = "#cccccc";
        const r = item.parent.regions[i];

        if (r) {
          if (r.selected) {
            col = "#ff0000";
          } else {
            col = r.states[0].getSelectedColor();
          }
        }

        return { fill: col };
      }}
      allowSelectionClear
      onTimeRangeChanged={(timerange, i) => {
        item.parent.regionChanged(timerange, i);
        item.parent.updateView();
      }}
      onTimeRangeClicked={i => {
        const r = item.parent.regions[i];
        item.parent.completion.regionStore.unselectAll();

        if (r) {
          r.selectRegion();
          item.parent.updateView();
        }
      }}
      /* onTimeRangeClicked={i => this.setState({ selected: i })} */
    />,
  ];

  // Get the value at the current tracker position for the ValueAxis
  let value = "--";
  // if (this.state.tracker) {
  //     const approx =
  //           (+this.state.tracker - +timerange.begin()) /
  //           (+timerange.end() - +timerange.begin());
  //     const ii = Math.floor(approx * series.size());
  //     const i = series.bisect(new Date(this.state.tracker), ii);
  //     const v = i < series.size() ? series.at(i).get(channelName) : null;
  //     if (v) {
  //         value = parseInt(v, 10);
  //     }
  // }

  // Get the summary values for the LabelAxis
  const summary = [
    { label: "Max", value: speedFormat(item._max) },
    { label: "Avg", value: speedFormat(item._avg) },
  ];

  const rows = [];

  return (
    <ChartContainer
      timeRange={item.parent.initialRange}
      format="relative"
      enablePanZoom={false}
      /* enableDragZoom={true} */
      onTimeRangeChanged={item.parent.updateTR}
      maxTime={item._series.range().end()}
      minTime={item._series.range().begin()}
      minDuration={60000}
    >
      <ChartRow height="200" key={`row-${item.value}`}>
        <LabelAxis
          id={`${item.value}_axis`}
          label={item.caption ? dn : ""}
          values={item.caption ? summary : []}
          min={0}
          max={item._max}
          width={item.caption ? 140 : 0}
          type="linear"
          format=",.1f"
        />
        <Charts>{charts}</Charts>
        {item.units && (
          <ValueAxis id={`${item.value}_valueaxis`} value={value} detail={item.units} width={80} min={0} max={35} />
        )}
      </ChartRow>
    </ChartContainer>
  );

  // Line charts
  // const charts = [
  //     <LineChart
  //       key={`line-${dn}`}
  //       axis={`${dn}_axis`}
  //       series={item._series}
  //       columns={[ dn ]}
  //       // style={style}
  //       breakLine
  //     />,
  // ];

  // Tracker info box
  // const trackerInfoValues = displayChannels
  //   .filter(channelName => channels[channelName].show)
  //   .map(channelName => {
  //     const fmt = format(channels[channelName].format);

  //     let series = channels[channelName].series.crop(timerange);

  //     let v = "--";
  //     if (this.state.tracker) {
  //       const i = series.bisect(new Date(this.state.tracker));
  //       const vv = series.at(i).get(channelName);
  //       if (vv) {
  //         v = fmt(vv);
  //       }
  //     }

  //     const label = channels[channelName].label;
  //     const value = `${v} ${channels[channelName].units}`;

  //     return { label, value };
  //   });

  // Axis list
  // const axisList = [
  //     <YAxis
  //       id={`${dn}_axis`}
  //       key={`${dn}_axis`}
  //       label={dn}
  //       min={0}
  //       max={item._max}
  //       width={70}
  //       type="linear"
  //       format={item.unitsformat}
  //     />
  // ];

  // return (
  //     <Resizable>
  //       <ChartContainer
  //         timeRange={item.parent.initialRange}
  //         format="relative"
  //         /* trackerPosition={this.state.tracker} */
  //         /* onTrackerChanged={this.handleTrackerChanged} */
  //         trackerShowTime
  //         enablePanZoom
  //         maxTime={maxTime}
  //         minTime={minTime}
  //         minDuration={minDuration}
  //         /* onTimeRangeChanged={this.handleTimeRangeChange} */
  //       >
  //         <ChartRow
  //           height="200"
  //           /* trackerInfoValues={trackerInfoValues} */
  //           /* trackerInfoHeight={10 + trackerInfoValues.length * 16} */
  //           trackerInfoWidth={140}
  //         >
  //           {axisList}
  //           <Charts>{charts}</Charts>
  //         </ChartRow>
  //       </ChartContainer>
  //     </Resizable>
  // );
});

const HtxTimeSeriesChannel = inject("store")(observer(HtxTimeSeriesChannelView));

Registry.addTag("timeserieschannel", TimeSeriesChannelModel, HtxTimeSeriesChannel);

export { TimeSeriesChannelModel, HtxTimeSeriesChannel };
