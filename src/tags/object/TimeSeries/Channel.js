import "moment-duration-format";
import React from "react";
import { TimeSeries } from "pondjs";
import { observer, inject } from "mobx-react";
import { types } from "mobx-state-tree";

import * as d3 from "d3";
import ObjectBase from "../Base";
import Registry from "../../../core/Registry";
import Types from "../../../core/Types";
import { guidGenerator } from "../../../core/Helpers";
import { runTemplate } from "../../../core/Template";
import { idFromValue, line, getRegionColor } from "./helpers";

/**
 * TimeSeriesChannel tag can be used to label time series data
 * @example
 * <View>
 *   <TimeSeries name="video" value="$timestamp">
 *      <TimeSeriesChannel value="$sensor1" />
 *      <TimeSeriesChannel value="$sensor2" />
 *   </TimeSeries>
 * </View>
 * @param {string} displayName name of the channel
 * @param {string} units units name
 * @param {string} unitsFormat format string for the units
 * @param {string} caption show channel caption view, like channel name, etc
 * @param {string} interpolation line interpolation mode
 * @param {string} showGrid show grid on the plot
 * @param {string} showTracker show tracker line on the plot
 * @param {string} height height of the plot
 * @param {string} opacity opacity of the line
 * @param {string=} [strokeColor=#f48a42] stroke color
 * @param {number=} [strokeWidth=1] width of the stroke
 * @param {string} value value
 */

const csMap = {
  curvestep: "curveStep",
  curvebasis: "curvebasis",
  curvebasisopen: "curveBasisOpen",
  curvebundle: "curveBundle",
  curvecardinal: "curveCardinal",
  curvecardinalopen: "curveCardinalOpen",
  curvecatmullrom: "curveCatmullRom",
  curvecatmullromopen: "curveCatmullRomOpen",
  curvelinear: "curveLinear",
  curvemonotonex: "curveMonotoneX",
  curvemonotoney: "curveMonotoneY",
  curvenatural: "curveNatural",
  curveradial: "curveRadial",
  curvestep: "curveStep",
  curvestepafter: "curveStepAfter",
  curvestepbefore: "curveStepBefore",
};

const TagAttrs = types.model({
  displayname: types.maybeNull(types.string),

  units: types.maybeNull(types.string),
  unitsformat: types.optional(types.string, ".1f"),
  caption: types.optional(types.boolean, true), // show channel caption view, like channel name, etc

  interpolation: types.optional(types.enumeration(Object.values(csMap)), "curveStep"),

  showgrid: types.optional(types.boolean, false),
  showtracker: types.optional(types.boolean, true),

  height: types.optional(types.string, "200"),

  opacity: types.optional(types.string, "0.8"),
  strokewidth: types.optional(types.string, "1"),
  strokecolor: types.optional(types.string, "#000000"),

  value: types.maybeNull(types.string),
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
    get regions() {
      return self.parent.regions;
    },
  }))
  .preProcessSnapshot(snapshot => {
    snapshot.interpolation = csMap[snapshot.interpolation];
    return snapshot;
  })
  .actions(self => ({
    handleTrackerChanged(t) {
      self.tracker = t;
      self.parent.updateView();
    },

    updateValue(store) {
      console.warn("CHANNEL UPDATE VALUE SMALL");
      self._value = runTemplate(self.value, store.task.dataObj, { raw: true });

      console.log("UPD", self.value, store.task.dataObj);
      console.log("UPD2", self._value, self.parent._value);

      self._simple = new TimeSeries({
        columns: ["time", "sensor1"],
        points: store.task.dataObj.time.map((t, i) => [t, store.task.dataObj.sensor1[i]]).filter((_, i) => i < 100),
      });

      self._d3 = store.task.dataObj.time.map((t, i) => ({
        date: new Date(t),
        sensor1: store.task.dataObj.sensor1[i],
        sensor2: store.task.dataObj.sensor2[i],
      }));

      // console.log('SIMEPLE', self._simple, store.task.dataObj.time.map((t, i) => [t, store.task.dataObj.sensor1[i]]))
      console.log("DDDDDDD3333", self._d3);

      const points = [];

      for (let i = 0; i <= self.parent._value[0][i]; i++) {
        points.push([self.parent._value[0][i], self._value[0][i]]);
      }

      const series = new TimeSeries({
        columns: ["time", self.value],
        points: points,
      });

      // Some simple statistics for each channel
      self._avg = parseInt(series.avg(self.value), 10);
      self._max = parseInt(series.max(self.value), 10);
      self._min = parseInt(series.min(self.value), 10);
      self._series = series;

      self._minTime = series.begin();
      self._maxTime = series.end();
    },
  }));

const TimeSeriesChannelModel = types.compose("TimeSeriesChannelModel", Model, TagAttrs, ObjectBase);

class ChannelD3 extends React.Component {
  ref = React.createRef();
  gBrushes;
  id = String(Math.round(Math.random() * 100000));

  getRegion(selection) {
    const [start, end] = selection.map(this.x.invert, this.x).map(Number);
    return { start, end };
  }

  renderBrushes(ranges) {
    const { width } = this.props.item.parent;
    const height = +this.props.item.height;
    const managerBrush = d3.brushX().extent([
      [0, 0],
      [width, height],
    ]);
    const x = this.x;
    console.log("RRR BBB", x.domain(), ranges);

    const brushSelection = this.gBrushes.selectAll(".brush").data(ranges, r => r.id);

    const brushend = i => () => {
      if (!d3.event.sourceEvent || !d3.event.selection) return;
      const region = this.getRegion(d3.event.selection);
      // @todo click simulation - selection didn't move
      if (region.start === ranges[i].start && region.end === ranges[i].end) {
        setTimeout(() => {
          this.props.item.parent.completion.regionStore.unselectAll();
          ranges[i].selectRegion();
          this.props.item.parent.updateView();
        }, 0);
      } else {
        console.log("REALLY ENDED", this.id, region, i);
        // clear d3 sourceEvent via async call
        setTimeout(() => this.props.item.parent.regionChanged(region, i), 0);
      }
    };

    // Set up new brushes
    brushSelection
      .enter()
      .append("g")
      .attr("class", "brush")
      .attr("id", (b, i) => {
        console.log("I", i);
        return `brush_${this.id}_${i}`;
      })
      .each(function(r, i) {
        const brush = d3.brushX().extent([
          [0, 0],
          [width, height],
        ]);

        brush.on("brush", () => console.log("BRUSHED")).on("end", brushend(i));
        console.log("ENTER THE BRUSH", r, i);

        const group = d3.select(this);

        brush(group);
        group.selectAll(".selection").attr("fill", getRegionColor(r, r.selected ? 0.8 : 0.5));
        group.selectAll(".overlay").style("pointer-events", "none");
      })
      .merge(brushSelection)
      .each(function(r, i) {
        managerBrush.move(d3.select(this), [r.start, r.end].map(x));
      });
  }

  brushCreator() {
    const { width } = this.props.item.parent;
    const height = +this.props.item.height;
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("end", () => {
        const activeStates = this.props.item.parent.activeStates();
        // if (!d3.event.sourceEvent || !d3.event.selection) return;
        if (!d3.event.sourceEvent) return;
        if (!d3.event.selection) {
          console.log("NOTHING SELECTED");
          setTimeout(() => {
            this.props.item.parent.completion.regionStore.unselectAll();
          }, 0);
          return;
        }
        const region = this.getRegion(d3.event.selection);
        setTimeout(() => brush.move(this.gCreator, null), 0);
        if (!activeStates || !activeStates.length) return;
        console.log("CREATE BRUSH", region, this.props.ranges.length);
        setTimeout(() => {
          this.props.item.parent.regionChanged(region, this.props.ranges.length);
        }, 0);
      });
    this.gCreator.call(brush);
  }

  renderAxis = () => {
    const { item } = this.props;
    const { width } = item.parent;
    const height = +item.height;
    console.log("X AXIS", this.x.domain());
    this.gx.attr("transform", `translate(0,${height})`).call(
      d3
        .axisBottom(this.x)
        .ticks(width / 80)
        .tickSizeOuter(0),
    );
  };

  componentDidMount() {
    const { data, item, range, time, value } = this.props;
    const { margin, width } = item.parent;
    const height = +item.height;
    const times = data[time];
    const values = data[value];
    const series = times.map((t, i) => [t, values[i]]);
    // series = series.slice(0, 1000);
    // for (let j = 5; j--; ) {
    //   const last = +series[series.length - 1].date;
    //   for (let i = 0, l = series.length; i < l; i++) {
    //     series[l + l - i - 1] = {...series[i], date: new Date(1000*(l - i) + last) };
    //   }
    // }
    // console.log("SSSS", series);
    // document.title = series.length;
    // const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    if (!this.ref.current) return;

    console.log("CHCHCHC", range, times, values);

    const x = d3
      .scaleUtc()
      // .clamp(true)
      .domain(d3.extent(times))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(values)])
      .range([height - margin.max, margin.min]);

    this.x = x;
    this.y = y;
    this.plotX = x.copy();
    console.log("YYY", y(10));
    console.log("YYY", y(0));

    //////////////////////////////////
    const main = d3
      .select(this.ref.current)
      .append("svg")
      .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
      .style("display", "block")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    main
      .append("clipPath")
      .attr("id", `clip_${this.id}`)
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", height)
      .attr("width", width);

    this.path = main
      .append("path")
      .datum(series)
      .attr("clip-path", `url("#clip_${this.id}")`)
      .attr("fill", "none")
      .attr("stroke", "steelblue");

    // this.path.attr("d", line(this.plotX, this.y));

    this.gx = main.append("g");
    main
      .append("g")
      .call(d3.axisLeft(y).tickSize(3))
      .call(g => g.select(".domain").remove())
      .call(g =>
        g
          .selectAll(".title")
          .data([value])
          .append("text")
          .attr("class", "title")
          .attr("font-size", 8)
          .attr("x", -margin.left)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(value),
      );

    this.setRange(range);

    this.gCreator = main.append("g").attr("class", "new_brush");
    this.brushCreator();

    // We initially generate a SVG group to keep our brushes' DOM elements in:
    this.gBrushes = main
      .append("g")
      .attr("class", "brushes")
      .attr("clip-path", `url("#clip_${this.id}")`);

    this.renderBrushes(this.props.ranges);
  }

  setRangeWithScaling(range) {
    this.x.domain(range);
    const current = this.x.range();
    const all = this.plotX.domain().map(this.x);
    const scale = (all[1] - all[0]) / (current[1] - current[0]);
    const translate = all[0] - current[0];
    console.log("SOME MATH", range, this.plotX.domain(), current, all, scale, translate);
    // this.path.attr("d", line(this.x, this.y));
    this.path.attr("transform", `translate(${translate} 0) scale(${scale} 1)`);
  }

  setRange(range) {
    this.x.domain(range);
    console.log("SOME MATH", range);
    this.path.attr("d", line(this.x, this.y));
    this.renderAxis();
  }

  componentDidUpdate(prevProps) {
    console.log(
      "UPD RANGES",
      this.props.value,
      this.props.ranges.length,
      this.props.ranges,
      prevProps.ranges,
      this.props.ranges !== prevProps.ranges,
    );
    console.log("UPD RANGE", this.props.range, prevProps.range);
    if (this.props.range !== prevProps.range) {
      this.setRange(this.props.range);
    }
    // if (this.props.ranges !== prevProps.ranges)
    this.renderBrushes(this.props.ranges);
  }

  render() {
    return <div ref={this.ref} length={this.props.ranges} />;
  }
}

// const HtxTimeSeriesChannelView = observer(({ store, item }) => <TS series={item._simple} />);
const HtxTimeSeriesChannelViewD3 = ({ store, item }) => {
  console.log("RENDER CHANNEL", item);
  return (
    <ChannelD3
      time={idFromValue(item.parent.value)}
      value={idFromValue(item.value)}
      item={item}
      data={store.task.dataObj}
      // @todo initialBrush is out of store, but it triggers; change to brushRange
      range={item.parent.initialRange}
      ranges={item.regions}
      forceUpdate={item.parent._needsUpdate}
    />
  );
};

const HtxTimeSeriesChannel = inject("store")(observer(HtxTimeSeriesChannelViewD3));

Registry.addTag("timeserieschannel", TimeSeriesChannelModel, HtxTimeSeriesChannel);

export { TimeSeriesChannelModel, HtxTimeSeriesChannel };
