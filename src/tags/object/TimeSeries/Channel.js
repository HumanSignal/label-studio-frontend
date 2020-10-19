import React, { useRef, useCallback, useMemo, useEffect } from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import * as d3 from "d3";
import ObjectBase from "../Base";
import Registry from "../../../core/Registry";
import Types from "../../../core/Types";
import { cloneNode, guidGenerator } from "../../../core/Helpers";
import {
  getOptimalWidth,
  getRegionColor,
  fixMobxObserve,
  formatTrackerTime,
  idFromValue,
  sparseValues,
  checkD3EventLoop,
} from "./helpers";
import { format as formatFNS } from "date-fns";
import InfoModal from "../../../components/Infomodal/Infomodal";
import { errorBuilder } from "../../../core/DataValidator/ConfigValidator";

/**
 * TimeSeriesChannel tag can be used to label time series data
 * @example
 * <View>
 *   <TimeSeries name="video" value="$timestamp">
 *      <TimeSeriesChannel value="$sensor1" />
 *      <TimeSeriesChannel value="$sensor2" />
 *   </TimeSeries>
 * </View>
 * @name TimeSeriesChannel
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
  }));

const TimeSeriesChannelModel = types.compose("TimeSeriesChannelModel", Model, TagAttrs, ObjectBase);

class ChannelD3 extends React.Component {
  ref = React.createRef();
  gCreator; // brush creator container
  brushCreator; // itself
  gBrushes;

  tracker;
  trackerPoint;
  trackerTime;
  trackerValue;

  extent = [0, 0];

  // if there is a huge data — use sliced data to optimize render
  useOptimizedData = false;
  // optimized data and count of slices come from parent
  optimizedSeries = null;
  // optimized data is enough to render zoomed data up to this level
  // and it is equal to the count of slices
  zoomStep = 10;

  // d3 lines to render full line
  line;
  // and just a part of data on the screen
  lineSlice;

  height = +this.props.item.height;

  state = {
    width: 840,
  };

  changeWidth = () => {
    const offsetWidth = this.ref.current.offsetWidth;
    console.log("WIDTH", offsetWidth);
    const { margin } = this.props.item.parent;
    if (offsetWidth) {
      const width = offsetWidth - margin.left - margin.right;
      this.setState({ width });
    }
  };

  getRegion = (selection, isInstant) => {
    const [start, end] = selection.map(n => +this.stick(n)[0]);
    return { start, end: isInstant ? start : end };
  };

  createBrushMovedHandler = id => () => {
    if (checkD3EventLoop("end") || !d3.event.selection) return;
    const { ranges } = this.props;
    const { parent } = this.props.item;
    const i = ranges.findIndex(range => range.id === id);
    if (i < 0) {
      console.error(`REGION ${id} was not found`);
      return;
    }
    const r = ranges[i];
    const moved = this.getRegion(d3.event.selection, r.instant);
    // click simulation - if selection didn't move
    const isJustClick = moved.start === r.start && moved.end === r.end;
    if (isJustClick) {
      parent.completion.unselectAreas();
      r.onClickRegion();
    } else {
      parent.regionChanged(moved, i);
    }
  };

  newRegion;
  newRegionTimer;

  newBrushHandler = () => {
    const {
      ranges,
      item: { parent },
    } = this.props;
    const activeStates = parent.activeStates();
    const statesSelected = activeStates && activeStates.length;
    // skip if event fired by .move() - prevent recursion and bugs
    if (checkD3EventLoop("end")) return;
    // just a click - create insant region or select region
    if (!d3.event.selection) {
      const x = d3.mouse(d3.event.sourceEvent.target)[0];
      const newRegion = this.newRegion;

      // when 2nd click happens during 300ms after 1st click and in the same place
      if (newRegion && Math.abs(newRegion.x - x) < 4) {
        clearTimeout(this.newRegionTimer);
        parent.regionChanged(newRegion.range, ranges.length, newRegion.states);
        this.newRegion = null;
        this.newRegionTimer = null;
      } else if (statesSelected) {
        // 1st click - store the data
        this.newRegion = {
          range: this.getRegion([x, x]),
          states: activeStates.map(s => cloneNode(s)),
          x,
        };
        // clear it in 300ms if there no 2nd click
        this.newRegionTimer = setTimeout(() => {
          this.newRegion = null;
          this.newRegionTimer = null;
        }, 300);
      }

      // select regions on this coords consequentially one after another
      // unselect regions after the last one
      const value = this.x.invert(x);
      const regions = ranges.filter(r => r.start <= value && r.end >= value);
      const nextIndex = regions.findIndex(r => r.selected) + 1;
      const region = regions[nextIndex];
      parent.completion.unselectAreas();
      region && region.onClickRegion();

      return;
    }
    const region = this.getRegion(d3.event.selection);
    this.brushCreator.move(this.gCreator, null);
    if (!statesSelected) return;
    parent.addRegion(region.start, region.end);
  };

  renderBrushes(ranges, flush = false) {
    const { width } = this.state;
    const height = this.height;
    const { item } = this.props;
    const extent = [
      [0, 0],
      [width, height],
    ];
    const managerBrush = d3.brushX().extent(extent);
    const x = this.x;
    const handleSize = 3;

    if (flush) {
      this.gBrushes.selectAll(".brush").remove();
    }

    const brushSelection = this.gBrushes.selectAll(".brush").data(ranges, r => r.id);
    const createHandler = this.createBrushMovedHandler;
    const updateTracker = this.updateTracker;
    const getRegion = this.getRegion;

    // Set up new brushes
    brushSelection
      .enter()
      .append("g")
      .attr("class", "brush")
      .attr("id", r => `brush_${item.id}_${r.id}`)
      .each(function(r) {
        const group = d3.select(this);
        const brush = d3.brushX().extent(extent);
        brush.on("brush", function() {
          if (checkD3EventLoop("brush")) return;
          const sticked = getRegion(d3.event.selection, r.instant);
          managerBrush.move(group, [x(sticked.start), x(sticked.end) + r.instant * 0.5]);
          updateTracker(d3.mouse(this)[0]);
        });
        brush.on("end", createHandler(r.id));
        brush(group);

        if (r.instant) {
          // no resizing, only moving
          group.selectAll(".handle").style("pointer-events", "none");
        } else {
          // no moving, only resizing to prevent out-of-screen bugs
          // also no reasons to move out-of-screen regions in real world
          group.selectAll(".selection").style("pointer-events", "none");
        }
        // all other space is taken by brushCreator
        group.selectAll(".overlay").style("pointer-events", "none");
        r._brushRefs = [].concat(r._brushRefs ?? [], group.selectAll(".selection").nodes());
      })
      .merge(brushSelection)
      .each(function(r, i) {
        const group = d3.select(this);
        const selection = group.selectAll(".selection");
        const color = getRegionColor(r);
        if (r.instant) {
          selection
            .attr("stroke-opacity", r.selected || r.highlighted ? 0.6 : 0.2)
            .attr("fill-opacity", r.selected || r.highlighted ? 1 : 0.6)
            .attr("stroke-width", 3)
            .attr("stroke", color)
            .attr("fill", color);
          const at = x(r.start);
          managerBrush.move(group, [at, at + 1]);
        } else {
          selection
            .attr("stroke-opacity", r.selected || r.highlighted ? 0.8 : 0.5)
            .attr("fill-opacity", r.selected || r.highlighted ? 0.6 : 0.3)
            .attr("stroke", color)
            .attr("fill", color);
          managerBrush.move(group, [r.start, r.end].map(x));
        }
      });
    brushSelection.exit().remove();
  }

  renderBrushCreator() {
    if (this.gCreator) {
      this.gCreator.selectAll("*").remove();
    } else {
      this.gCreator = this.main.append("g").attr("class", "new_brush");
    }

    const updateTracker = this.updateTracker;
    const block = this.gCreator;
    const getRegion = this.getRegion;
    const x = this.x;
    const brush = (this.brushCreator = d3
      .brushX()
      .extent([
        [0, 0],
        [this.state.width, this.height],
      ])
      .on("brush", function() {
        if (checkD3EventLoop("brush") || !d3.event.selection) return;
        const sticked = getRegion(d3.event.selection);
        brush.move(block, [x(sticked.start), x(sticked.end)]);
        updateTracker(d3.mouse(this)[0]);
      })
      .on("end", this.newBrushHandler));

    this.gCreator.call(this.brushCreator);
  }

  updateTracker = screenX => {
    const { width } = this.state;
    if (screenX < 0 || screenX > width) return;
    const [dataX, dataY] = this.stick(screenX);
    this.tracker.attr("transform", `translate(${this.x(dataX) + 0.5},0)`);
    this.trackerTime.text(this.formatTime(dataX));
    this.trackerValue.text(this.formatValue(dataY) + " " + this.props.item.units);
    this.trackerPoint.attr("cy", this.y(dataY));
    this.tracker.attr("text-anchor", screenX > width - 100 ? "end" : "start");
  };

  renderTracker = () => {
    const updateTracker = this.updateTracker;

    this.tracker = this.main.append("g").style("pointer-events", "none");
    this.trackerValue = this.tracker
      .append("text")
      .attr("font-size", 10)
      .attr("fill", "#666");
    this.trackerTime = this.tracker
      .append("text")
      .attr("y", this.height - 1)
      .attr("font-size", 10)
      .attr("fill", "#666");
    this.trackerPoint = this.tracker
      .append("circle")
      .attr("cx", 0)
      .attr("r", 3)
      .attr("stroke", "red")
      .attr("fill", "none");
    this.tracker
      .append("line")
      .attr("y1", this.height)
      .attr("y2", 0)
      .attr("stroke", "#666");

    function onHover() {
      updateTracker(d3.mouse(this)[0]);
    }

    this.main.on("mousemove", onHover);
  };

  renderXAxis = () => {
    const { item } = this.props;
    const { width } = this.state;
    const { margin } = item.parent;
    const tickSize = this.height + margin.top;
    const shift = -margin.top;
    const g = this.main.selectAll(".xaxis").data([0]);
    g.enter()
      .append("g")
      .attr("class", "xaxis");
    g.attr("transform", `translate(0,${shift})`)
      .call(
        d3
          .axisBottom(this.x)
          .ticks(width / 80)
          .tickSize(tickSize + 4),
      )
      .call(g => g.selectAll(".domain").remove())
      // @todo `clone is not a function` wtf?
      // .call(g => g.selectAll(".tick line").clone().attr("y1", 18).attr("y2", 22));
      .call(g =>
        g
          .selectAll(".tick")
          .attr("stroke-opacity", 0.2)
          .selectAll(".bottom")
          .data([0])
          .enter()
          .append("line")
          .attr("class", "bottom")
          .attr("stroke", "currentColor")
          .attr("y1", tickSize + 16)
          .attr("y2", tickSize + margin.bottom),
      );
  };

  renderYAxis = () => {
    this.main
      .append("g")
      .call(
        d3
          .axisLeft(this.y)
          .tickFormat(this.formatValue)
          .tickSize(3),
      )
      .call(g => g.select(".domain").remove())
      .call(g =>
        g
          .append("text")
          .attr("class", "title")
          .attr("font-size", 8)
          .attr("x", -6)
          .attr("y", 0)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text(this.props.item.units),
      );
  };

  initZoom() {
    const { data, item, time } = this.props;
    const times = data[time];
    const upd = item.parent.throttledRangeUpdate();
    const onZoom = () => {
      const e = d3.event;
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const { range } = this.props;
      const indices = range.map(r => d3.bisectRight(times, r));
      const MAX_POINTS_ON_SCREEN = 10;
      const [x] = d3.mouse(d3.event.target);
      const width = this.x.range()[1];
      // slow down zooming in
      const scale = Math.min(0.3, -e.deltaY / this.height);
      // if there are too few points displayed, don't zoom in
      if (indices[1] - indices[0] < MAX_POINTS_ON_SCREEN && scale > 0) return;

      const shift = range[1] - range[0];
      const zoomed = [
        Math.max(+this.extent[0], +range[0] + (shift * scale * x) / width),
        Math.min(+this.extent[1], range[1] - shift * scale * (1 - x / width)),
      ];
      upd(zoomed, scale);
    };

    this.main.on("wheel", onZoom);
  }

  componentDidMount() {
    if (!this.ref.current) return;

    const { data, item, range, time, value } = this.props;
    const { isDate, formatTime, margin, slicesCount } = item.parent;
    const height = this.height;
    this.zoomStep = slicesCount;
    const clipPathId = `clip_${item.id}`;

    const times = data[time];
    const values = data[value];
    const { series } = this.props;

    if (!values) {
      const names = Object.keys(data).filter(name => name !== time);
      const message = `\`${value}\` not found in data. Available columns: ${names.join(
        ", ",
      )}. For headless csv you can use \`column#0\``;
      item.store.completionStore.addErrors([errorBuilder.generalError(message)]);
      return;
    }

    // initially it checks do we even need this optimization
    // but then this is a switch between optimized and original data
    this.useOptimizedData = series.length > getOptimalWidth() * this.zoomStep;
    if (this.useOptimizedData) {
      this.optimizedSeries = sparseValues(series, getOptimalWidth() * this.zoomStep);
    }
    this.slices = item.parent.dataSlices;

    const formatValue = d3.format(item.unitsformat);
    this.formatValue = formatValue;
    this.formatTime = formatTime;

    const offsetWidth = this.ref.current.offsetWidth;
    const width = offsetWidth ? offsetWidth - margin.left - margin.right : this.state.width;
    // intention direct assignment to avoid rerender and correct initialization
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state.width = width;

    this.extent = d3.extent(times);

    const scale = isDate ? d3.scaleTime() : d3.scaleLinear();
    const x = scale
      // .clamp(true)
      .domain(this.extent)
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([d3.min(values), d3.max(values)])
      .range([height - margin.max, margin.min]);

    const stick = screenX => {
      const dataX = x.invert(screenX);
      let i = d3.bisectRight(times, dataX);
      if (times[i] - dataX > dataX - times[i - 1]) i--;
      return [times[i], values[i]];
    };

    this.x = x;
    this.y = y;
    this.plotX = x.copy();
    this.stick = stick;

    this.line = d3
      .line()
      .y(d => this.y(d[value]))
      .x(d => this.plotX(d[time]));

    this.lineSlice = d3
      .line()
      .defined(d => d[time] >= range[0] && d[time] <= range[1])
      .y(d => this.y(d[value]))
      .x(d => this.x(d[time]));

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
      .attr("id", clipPathId)
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", height)
      .attr("width", width);

    // decorative huge opaque block with channel name on background
    main
      .append("text")
      .text(item.displayname)
      .attr("dx", "1em")
      .attr("dy", "1em")
      .attr("font-weight", "bold")
      .attr("font-size", "1.4em")
      .attr("dy", "1em")
      .attr("opacity", 0.1);

    this.main = main;

    const pathContainer = main.append("g").attr("clip-path", `url("#${clipPathId}")`);
    this.path = pathContainer
      .append("path")
      .datum(this.useOptimizedData ? this.optimizedSeries : series)
      .attr("d", this.line);
    // to render different zoomed slices of path
    this.path2 = pathContainer.append("path");

    pathContainer
      .selectAll("path")
      .attr("vector-effect", "non-scaling-stroke")
      .attr("fill", "none")
      .attr("stroke", item.strokecolor || "steelblue");

    this.renderTracker();
    this.renderYAxis();
    this.setRangeWithScaling(range);
    this.renderBrushCreator();
    this.initZoom();

    // We initially generate a SVG group to keep our brushes' DOM elements in:
    this.gBrushes = main
      .append("g")
      .attr("class", "brushes")
      .attr("clip-path", `url("#${clipPathId}")`);

    this.renderBrushes(this.props.ranges);

    window.addEventListener("resize", this.changeWidth);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.changeWidth);
  }

  setRangeWithScaling(range) {
    this.x.domain(range);
    const current = this.x.range();
    const all = this.plotX.domain().map(this.x);
    const scale = (all[1] - all[0]) / (current[1] - current[0]);
    const left = Math.max(0, Math.floor((this.zoomStep * (current[0] - all[0])) / (all[1] - all[0])));
    const right = Math.max(0, Math.floor((this.zoomStep * (current[1] - all[0])) / (all[1] - all[0])));
    const translate = all[0] - current[0];
    console.log(
      "SOME MATH",
      left,
      right,
      [...range],
      this.plotX.domain(),
      current,
      all,
      scale,
      translate,
      this.useOptimizedData,
    );

    // zoomStep - zoom level when we need to switch between optimized and original data
    const haveToSwitchData = scale > this.zoomStep === this.useOptimizedData;
    if (this.optimizedSeries && haveToSwitchData) {
      this.useOptimizedData = !this.useOptimizedData;
      if (this.useOptimizedData) {
        this.path.datum(this.optimizedSeries);
        this.path.attr("d", this.line);
      } else {
        this.path.attr("transform", ``);
      }
    }

    if (this.useOptimizedData) {
      this.path.attr("transform", `translate(${translate} 0) scale(${scale} 1)`);
      this.path2.attr("d", "");
    } else {
      if (this.optimizedSeries) {
        this.path.datum(this.slices[left]);
        this.path.attr("d", this.lineSlice);
        if (left !== right) {
          this.path2.datum(this.slices[right]);
          this.path2.attr("d", this.lineSlice);
        } else {
          this.path2.attr("d", "");
        }
      } else {
        this.path.attr("d", this.lineSlice);
        this.path2.attr("d", "");
      }
    }

    this.renderXAxis();
  }

  componentDidUpdate(prevProps, prevState) {
    const { range } = this.props;
    const { width } = this.state;
    let flushBrushes = false;

    if (width !== prevState.width) {
      const { item, range } = this.props;
      const { margin } = item.parent;
      const height = this.height;
      const svg = d3.select(this.ref.current).selectAll("svg");

      svg.attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom]);
      this.x.range([0, width]);
      this.renderBrushCreator();
      svg.selectAll("clipPath rect").attr("width", width);

      this.setRangeWithScaling(range);
      this.renderBrushCreator();
      flushBrushes = true;
    } else {
      const domain = this.x.domain();
      if (+domain[0] !== +range[0] || +domain[1] !== +range[1]) {
        this.setRangeWithScaling(range);
      }
    }

    this.renderBrushes(this.props.ranges, flushBrushes);
  }

  render() {
    this.props.ranges.map(r => fixMobxObserve(r.start, r.end, r.selected, r.highlighted, r.style.fillcolor));
    fixMobxObserve(this.props.range.map(Number));

    return <div className="htx-timeseries-channel" ref={this.ref} />;
  }
}

const ChannelD3Observed = observer(ChannelD3);

// const HtxTimeSeriesChannelView = observer(({ store, item }) => <TS series={item._simple} />);
const HtxTimeSeriesChannelViewD3 = ({ item }) => {
  if (!item.parent.dataObj) return null;
  // @todo maybe later for some other option
  // let channels = item.parent.overviewchannels;
  // if (channels) channels = channels.split(",");
  // if (channels && !channels.includes(item.value.substr(1))) return null;

  return (
    <ChannelD3Observed
      time={idFromValue(item.parent.timevalue)}
      value={idFromValue(item.value)}
      item={item}
      data={item.parent.dataObj}
      series={item.parent.dataHash}
      range={item.parent.brushRange}
      ranges={item.parent.regs}
    />
  );
};

const HtxTimeSeriesChannel = observer(HtxTimeSeriesChannelViewD3);

Registry.addTag("timeserieschannel", TimeSeriesChannelModel, HtxTimeSeriesChannel);

export { TimeSeriesChannelModel, HtxTimeSeriesChannel };
