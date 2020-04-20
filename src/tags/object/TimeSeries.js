import "moment-duration-format";
import React, { Fragment } from "react";
import _ from "underscore";
import moment from "moment";
import * as d3 from "d3";
import {
  AreaChart,
  Brush,
  ChartContainer,
  ChartRow,
  Charts,
  LabelAxis,
  styler,
  Resizable,
} from "react-timeseries-charts";
import { Button, Icon } from "antd";
import { Slider } from "antd";
import { TimeSeries, TimeRange, avg, percentile, median, indexedSeries } from "pondjs";
import { format } from "d3-format";
import { observer, inject } from "mobx-react";
import { types, getRoot, getType } from "mobx-state-tree";

import ObjectTag from "../../components/Tags/Object";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import Types from "../../core/Types";
import { TimeSeriesChannelModel, HtxTimeSeriesChannel } from "./TimeSeries/Channel";
import { TimeSeriesRegionModel } from "../../regions/TimeSeriesRegion";
import { cloneNode } from "../../core/Helpers";
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";
import { runTemplate } from "../../core/Template";
import { idFromValue, getRegionColor } from "./TimeSeries/helpers";

/**
 * TimeSeries tag can be used to label time series data
 * @example
 * <View>
 *   <TimeSeries name="device" value="$time">
 *      <TimeSeriesChannel value="$sensor1" />
 *      <TimeSeriesChannel value="$sensor2" />
 *   </TimeSeries>
 * </View>
 * @param {string} name of the element
 * @param {string} value timestamps
 */
const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  value: types.maybeNull(types.string),
  multiaxis: types.optional(types.boolean, false), // show channels in the same view
  // visibilitycontrols: types.optional(types.boolean, false), // show channel visibility controls
  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model("TimeSeriesModel", {
    id: types.optional(types.identifier, guidGenerator),
    type: "timeseries",
    children: Types.unionArray(["timeserieschannel", "timeseriesoverview", "view", "hypertext"]),
    regions: types.array(TimeSeriesRegionModel),

    width: 840,
    margin: types.frozen({ top: 20, right: 20, bottom: 30, left: 40, min: 10, max: 10 }),
    brushRange: types.array(types.Date),

    // _value: types.optional(types.string, ""),
    _needsUpdate: types.optional(types.number, 0),
  })
  .views(self => ({
    get regionsTimeRanges() {
      return self.regions.map(r => {
        return [r.start, r.end];
      });
    },

    get store() {
      return getRoot(self);
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },

    states() {
      return self.completion.toNames.get(self.name);
    },

    activeStates() {
      const states = self.states();
      console.log("STATES", states);
      return states ? states.filter(s => s.isSelected && getType(s).name === "TimeSeriesLabelsModel") : null;
    },
  }))

  .actions(self => ({
    updateView() {
      self._needsUpdate = self._needsUpdate + 1;
    },

    updateTR(tr) {
      if (tr === null) return;

      console.log("UPD TR", tr);

      self.initialRange = tr;
      self.brushRange = tr;
      self.updateView();
    },

    fromStateJSON(obj, fromModel) {
      if (obj.value.choices) {
        self.completion.names.get(obj.from_name).fromStateJSON(obj);
      }

      if ("timeserieslabels" in obj.value) {
        const states = restoreNewsnapshot(fromModel);
        states.fromStateJSON(obj);

        self.createRegion(obj.value.start, obj.value.end, [states]);

        self.updateView();
      }
    },

    updateValue(store) {
      console.warn("TS UPDATE VALUE SMALL");
      self._value = runTemplate(self.value, store.task.dataObj);
    },

    toStateJSON() {
      return self.regions.map(r => r.toStateJSON());
    },

    createRegion(start, end, states) {
      const r = TimeSeriesRegionModel.create({
        start: start,
        end: end,
        states: states,
      });

      self.regions.push(r);
      self.completion.addRegion(r);

      return r;
    },

    addRegion(start, end) {
      const states = self.activeStates();

      // do to net labeling happen when there were no labels selected
      if (!states.length) return;

      const clonedStates = states && states.map(s => cloneNode(s));
      const r = self.createRegion(start, end, clonedStates);

      states && states.forEach(s => s.unselectAll());

      return r;
    },

    regionChanged(timerange, i) {
      const r = self.regions[i];
      let needUpdate = false;
      console.log("REGION TO CHANGE", r, i);

      if (!r) {
        self.addRegion(timerange.start, timerange.end);
        needUpdate = true;
      } else {
        needUpdate = r.start !== timerange.start || r.end !== timerange.end;
        r.start = timerange.start;
        r.end = timerange.end;
      }
      needUpdate && self.updateView();
    },

    updateValue(store) {
      self._value = runTemplate(self.value, store.task.dataObj, { raw: true });
      console.warn("TS UPDATE VALUE BIG", store.task.dataObj, self.value, self._value);

      // const points = [];
      // const val = 1400429552000;
      // const idx = 0;
      // for (let i = 0; i <= self._value[0].length; i++) {
      //   points.push([val + 1000 * i]);
      // }

      // window.A = points;

      // // console.log(points);

      // // const points = self._value[0].map(p => [Math.floor(val + p * 100) * 1000]);

      // //const points = self._value[1].forEach(p => [ val + ]);
      // // const points = self._value[0].map(p => [p]);

      // console.log(points);

      // // TODO need to figure out why this TS object is not
      // // returning a proper timerange
      // const series = new TimeSeries({
      //   name: "time",
      //   columns: ["time"],
      //   utc: false,
      //   points: points,
      // });

      // // console.log(points);

      // self.series = series;

      // const size = series.size();
      // const piece = Math.ceil(size / 10);
      // const pcTR = series.slice(0, piece).timerange();

      // self.initialRange = pcTR;
      const times = store.task.dataObj[idFromValue(self.value)];
      self.initialRange = [times[0], times[times.length >> 2]];
      self.brushRange = [times[0], times[times.length >> 2]];
    },

    onHotKey() {},
  }));

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

const TimeSeriesOverviewRTS = observer(({ item }) => {
  // console.log(item.series.timerange());

  return (
    <div data-id={item._needsUpdate}>
      <Resizable>
        <ChartContainer
          timeAxisHeight={0}
          timeRange={item.series.timerange()}
          // format="relative"
          /* trackerPosition={this.state.tracker} */
        >
          <ChartRow height="40" debug={false} style={{ fill: "#333333" }}>
            <Brush
              timeRange={item.brushRange}
              style={{ fill: "#cccccc", strokeWidth: 1, stroke: "#cacaca" }}
              allowSelectionClear
              onTimeRangeChanged={item.updateTR}
            />
            <Charts>
              <AreaChart
                axis="axis1"
                style={{ fill: "#cc0000" }}
                /* columns={{ up: ["altitude"], down: [] }} */
                series={item.series}
              />
            </Charts>
          </ChartRow>
        </ChartContainer>
      </Resizable>
    </div>
  );
});

// class TimeSeriesOverviewD3 extends React.Component {
const Overview = ({ item, store, regions, forceUpdate }) => {
  const ref = React.useRef();

  const focusHeight = 100;
  const { margin, value, width } = item;
  const idX = idFromValue(value);
  const data = store.task.dataObj;
  const keys = Object.keys(data).filter(key => key !== idX);
  const series = data[idX];
  // const fullHeight = focusHeight + margin.min + margin.max;

  let focus = React.useRef();
  let gRegions = React.useRef();

  console.log("TS MOUNTED", width, margin);

  const x = d3
    .scaleUtc()
    .domain(d3.extent(series))
    .range([0, width]);

  const drawPath = key => {
    console.log("DRAW PATH", data[key], series);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data[key])])
      .range([focusHeight - margin.max, margin.min]);

    focus.current
      .append("path")
      .datum(data[key].slice(0, series.length))
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr(
        "d",
        d3
          .line()
          .x((d, i) => x(series[i]))
          .y(d => y(d)),
      );
  };

  const drawRegions = ranges => {
    const rSelection = gRegions.current.selectAll(".region").data(ranges);
    rSelection
      .enter()
      .append("rect")
      .attr("class", "region")
      .merge(rSelection)
      .attr("y", 0)
      .attr("height", focusHeight)
      .attr("x", r => x(r.start))
      .attr("width", r => x(r.end) - x(r.start))
      .attr("fill", r => getRegionColor(r, r.selected ? 0.5 : 0.3));
  };

  React.useEffect(() => {
    focus.current = d3
      .select(ref.current)
      .append("svg")
      .attr("viewBox", [0, 0, width + margin.left + margin.right, focusHeight])
      .style("display", "block")
      .append("g")
      .attr("transform", "translate(" + margin.left + ",0)");

    for (let key of keys) drawPath(key);

    gRegions.current = focus.current.append("g").attr("class", "regions");
    console.log("G REGIONS", gRegions.current, regions);
    // drawRegions(regions);

    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [width, focusHeight],
      ])
      .on("brush", brushed)
      .on("end", brushended);

    const defaultSelection = [0, width >> 2];

    const gb = focus.current
      .append("g")
      .call(brush)
      .call(brush.move, defaultSelection);

    function brushed() {
      if (d3.event.selection) {
        const [start, end] = d3.event.selection.map(x.invert, x);
        item.updateTR([start, end]);
      }
    }

    function brushended() {
      if (!d3.event.selection) {
        gb.call(brush.move, defaultSelection);
      }
    }
  }, []);

  React.useEffect(() => {
    console.log("TS UPDATED", regions);
    drawRegions(regions);
  }, [item, item.regions, regions, forceUpdate]);

  return <div ref={ref} />;
};

// const Overview = TimeSeriesOverviewD3;
// const Overview = observer(TimeSeriesOverviewD3);

const HtxTimeSeriesViewRTS = observer(({ store, item }) => {
  console.log("TS RENDER");
  return (
    <ObjectTag item={item}>
      {/* <div
        onWheel={e => {
          e = e || window.event;
          if (e.preventDefault) {
            e.preventDefault();
          }
          e.returnValue = false;
          return false;
        }}
      > */}
      {Tree.renderChildren(item)}
      {/* <div id="focus"></div> */}
      {/* <TimeSeriesOverviewD3 store={store} item={item} /> */}
      <Overview store={store} item={item} regions={item.regions} forceUpdate={item._needsUpdate} />
    </ObjectTag>
  );
});

const TimeSeriesModel = types.compose("TimeSeriesModel", TagAttrs, Model);
const HtxTimeSeries = inject("store")(observer(HtxTimeSeriesViewRTS));

Registry.addTag("timeseries", TimeSeriesModel, HtxTimeSeries);

export { TimeSeriesModel, HtxTimeSeries };
