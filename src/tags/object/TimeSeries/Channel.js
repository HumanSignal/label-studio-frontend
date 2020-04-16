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
import d3_timeseries from "d3-timeseries";
import * as d3 from "d3";
import "../../../d3-timeseries.min.css";
import ObjectBase from "../Base";
import ObjectTag from "../../../components/Tags/Object";
import Registry from "../../../core/Registry";
import Types from "../../../core/Types";
import { guidGenerator, restoreNewsnapshot } from "../../../core/Helpers";
import { runTemplate } from "../../../core/Template";
import Utils from "../../../utils";

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

const HtxTimeSeriesChannelViewTS = observer(({ store, item }) => {
  if (!item._value) return null;

  console.time("prerender");

  const u = item.parent._needsUpdate;
  const timerange = item.parent.initialRange;
  const maxTime = item._maxTime;
  const minTime = item._minTime;
  const minDuration = 10 * 60 * 1000;
  const durationPerPixel = timerange.duration() / 800 / 1000;
  const dn = item.displayname;

  const style = {};
  style[item.value] = {
    normal: {
      stroke: item.strokecolor,
      strokeWidth: parseInt(item.strokewidth),
      opacity: parseFloat(item.opacity),
    },
  };

  console.time("charts");
  const charts = [
    <LineChart
      key={`line-${item.value}-{$u}`}
      axis={`${item.value}_axis`}
      series={item._series}
      interpolation={item.interpolation}
      style={style}
      columns={[item.value]}
      // style={style}
      breakLine
    />,
    <MultiBrush
      key={`mb-${item.value}-{$u}`}
      timeRanges={item.parent.regionsTimeRanges}
      style={i => {
        let col = "#cccccc";
        let border = "";
        let dash = "";

        const r = item.parent.regions[i];

        if (r) {
          const stateProvidesColor = r.states.find(s => s.hasOwnProperty("getSelectedColor"));
          const sCol = Utils.Colors.convertToRGBA(stateProvidesColor.getSelectedColor(), 1);

          if (r.selected || r.highlighted) {
            col = sCol;
            border = "#00aeff";
            dash = "2 1";
          } else {
            col = Utils.Colors.rgbaChangeAlpha(sCol, 0.8);
          }
        }

        return { fill: col, stroke: border, strokeDasharray: dash };
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
  console.timeEnd("charts");

  // Get the value at the current tracker position for the ValueAxis
  let value = "--";
  const series = item._series;

  const getValue = function() {
    if (!item.tracker) return;

    const approx = (+item.tracker - +timerange.begin()) / (+timerange.end() - +timerange.begin());
    const ii = Math.floor(approx * series.size());
    const i = series.bisect(new Date(item.tracker), ii);

    try {
      return series.at(i).get(item.value);
    } catch {
      return null;
    }
  };

  console.time("value");
  const uval = getValue();
  console.timeEnd("value");

  value = item.tracker && uval;

  const showtracker = item.showtracker && uval;

  const formatFn = format(item.unitsformat);

  const summary = [
    { label: "Max", value: formatFn(item._max) },
    { label: "Avg", value: formatFn(item._avg) },
    { label: "Min", value: formatFn(item._min) },
  ];

  const rows = [];
  const r = item._series;

  const trackerInfoValues = (function() {
    const label = item.units ? item.units : "value";
    const value = item.tracker ? getValue() : "--";

    return [{ label, value }];
  })();
  console.timeEnd("prerender");

  console.log("CONSTANT RERENDER");

  return (
    <Resizable>
      <ChartContainer
        trackerPosition={showtracker ? item.tracker : null}
        onTrackerChanged={item.handleTrackerChanged}
        timeRange={item.parent.initialRange}
        enablePanZoom={false}
        utc={true}
        showGrid={false}
        onTimeRangeChanged={item.parent.updateTR}
        maxTime={r.end()}
        minTime={r.begin()}
        minDuration={60000}
      >
        <ChartRow
          height={item.height}
          key={`row-${item.value}`}
          trackerInfoValues={!item.units && trackerInfoValues}
          trackerInfoHeight={10 + trackerInfoValues.length * 16}
          trackerInfoWidth={140}
        >
          <LabelAxis
            id={`${item.value}_axis`}
            label={item.caption ? dn : ""}
            values={item.caption ? summary : []}
            min={item._min}
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
    </Resizable>
  );
});

const TS = ({ series }) => {
  const [range, setRange] = React.useState(series.slice(0, series.size() >> 3).timerange());
  console.log("SSSSSSSSSS", series);

  return (
    <Resizable>
      <ChartContainer timeRange={series.timerange()}>
        <ChartRow height="200">
          <YAxis
            id="axis1"
            label="AUD"
            min={series.min("sensor1")}
            max={series.max("sensor1")}
            width="60"
            type="linear"
            format="$,.2f"
          />
          <Brush
            timeRange={range}
            style={{ fill: "#cccccc", strokeWidth: 1, stroke: "#cacaca" }}
            allowSelectionClear
            onTimeRangeChanged={setRange}
          />
          <Charts>
            <LineChart axis="axis1" series={series} columns={["sensor1"]} />
          </Charts>
          <YAxis id="axis2" label="Euro" min={0.5} max={1.5} width="80" type="linear" format="$,.2f" />
        </ChartRow>
      </ChartContainer>
    </Resizable>
  );
};

const D31 = ({ name, series }) => {
  name = name.substr(1);
  const id = `chart_${name}`;
  console.log("DDD333", name, series.slice(0, 20));
  setTimeout(() => {
    const width = 820;
    const chart = d3_timeseries()
      .addSerie(series, { x: "date", y: name }, { interpolate: "linear" })
      .width(width);
    // const e = chart(`#${id}`);
    // console.log('CHHH', e);

    // setTimeout(() => {
    const svg = d3
      .select(`#${id}`)
      .append(`svg`)
      .attr("viewBox", [0, 0, width, 400]);
    console.log("WWWWW", svg.attr("width"));
    console.log("SVG", svg.node(), svg.node().width);

    const data = series.slice(0, 100);
    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, d => +d.date))
      .nice()
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, d => d.sensor1))
      .nice()
      .range([0, 400]);

    const brush = d3
      .brushX()
      // .extent([[0, 0], [300, 400]])
      .on("start", () => console.log("STRTDDD"))
      .on("brush", () => console.log("BRSHDD"));
    // d3.select(`#${id}`)
    // .append("g")
    // .attr("class", "brush")
    // .attr('viewBox', [0, 0, 820, 400])
    svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(data.slice(0, 100))
      .enter()
      .append("circle")
      .attr("transform", d => `translate(${x(d.date)},${y(d.sensor1)})`)
      .attr("r", 3);
    svg.call(brush);
    // }, 1300)
  }, 400);
  return <div id={id}>Hello</div>;
};

const brushes = gBrushes => {
  // We also keep the actual d3-brush functions and their IDs in a list:
  var brushes = [];

  /* CREATE NEW BRUSH
   *
   * This creates a new brush. A brush is both a function (in our array) and a set of predefined DOM elements
   * Brushes also have selections. While the selection are empty (i.e. a suer hasn't yet dragged)
   * the brushes are invisible. We will add an initial brush when this viz starts. (see end of file)
   * Now imagine the user clicked, moved the mouse, and let go. They just gave a selection to the initial brush.
   * We now want to create a new brush.
   * However, imagine the user had simply dragged an existing brush--in that case we would not want to create a new one.
   * We will use the selection of a brush in brushend() to differentiate these cases.
   */
  function newBrush() {
    var brush = d3
      .brushX()
      .on("start", brushstart)
      .on("brush", brushed)
      .on("end", brushend);

    brushes.push({ id: brushes.length, brush: brush });

    function brushstart() {
      // your stuff here
    }

    function brushed() {
      // your stuff here
    }

    function brushend() {
      // Figure out if our latest brush has a selection
      var lastBrushID = brushes[brushes.length - 1].id;
      var lastBrush = document.getElementById("brush-" + lastBrushID);
      var selection = d3.brushSelection(lastBrush);

      // If it does, that means we need another one
      if (selection && selection[0] !== selection[1]) {
        newBrush();
      }

      // Always draw brushes
      drawBrushes();
    }
  }

  function drawBrushes() {
    var brushSelection = gBrushes.selectAll(".brush").data(brushes, function(d) {
      return d.id;
    });

    // Set up new brushes
    brushSelection
      .enter()
      .insert("g", ".brush")
      .attr("class", "brush")
      .attr("id", function(brush) {
        return "brush-" + brush.id;
      })
      .each(function(brushObject) {
        //call the brush
        brushObject.brush(d3.select(this));
      });

    /* REMOVE POINTER EVENTS ON BRUSH OVERLAYS
     *
     * This part is abbit tricky and requires knowledge of how brushes are implemented.
     * They register pointer events on a .overlay rectangle within them.
     * For existing brushes, make sure we disable their pointer events on their overlay.
     * This frees the overlay for the most current (as of yet with an empty selection) brush to listen for click and drag events
     * The moving and resizing is done with other parts of the brush, so that will still work.
     */
    brushSelection.each(function(brushObject) {
      d3.select(this)
        .attr("class", "brush")
        .selectAll(".overlay")
        .style("pointer-events", function() {
          var brush = brushObject.brush;
          if (brushObject.id === brushes.length - 1 && brush !== undefined) {
            return "all";
          } else {
            return "none";
          }
        });
    });

    brushSelection.exit().remove();
  }

  newBrush();
  drawBrushes();
};

const D3 = ({ name, series }) => {
  name = name.substr(1);
  const id = `chart_${name}`;
  const width = 820;
  const height = 400;
  const focusHeight = 100;
  // series = series.slice(0, 1000);
  // for (let j = 5; j--; ) {
  //   const last = +series[series.length - 1].date;
  //   for (let i = 0, l = series.length; i < l; i++) {
  //     series[l + l - i - 1] = {...series[i], date: new Date(1000*(l - i) + last) };
  //   }
  // }
  console.log("SSSS", series);
  document.title = series.length;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };

  const x = d3
    .scaleUtc()
    .domain(d3.extent(series, d => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(series, d => d[name])])
    .range([height - margin.bottom, margin.top]);

  window.x = x;
  window.y = y;
  console.log("YYY", y(10));
  console.log("YYY", y(0));

  const xAxis = (g, x, height) =>
    g.attr("transform", `translate(0,${height - margin.bottom})`).call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0),
    );

  const area = (xx, yy) =>
    d3
      .area()
      .defined(d => !isNaN(d[name]))
      .x(d => xx(d.date))
      .y0(yy(0))
      .y1(d => yy(d[name]));

  const line = (xx, yy) =>
    d3
      .line()
      .x(d => xx(d.date))
      .y(d => yy(d[name]));

  //////////////////////////////////
  setTimeout(() => {
    const main = d3
      .select("#" + id)
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("display", "block");

    console.log("SEL", d3.select("#" + id));

    const clipId = "clip_" + Math.random();

    main
      .append("clipPath")
      .attr("id", clipId.id)
      .append("rect")
      .attr("x", margin.left)
      .attr("y", 0)
      .attr("height", height)
      .attr("width", width - margin.left - margin.right);

    const gx = main.append("g");

    const gy = main.append("g");

    const path = main
      .append("path")
      .datum(series)
      .attr("clip-path", clipId)
      .attr("fill", "none")
      .attr("stroke", "steelblue");

    // return Object.assign(main.node(), {
    //   update(focusX, focusY) {
    //     gx.call(xAxis, focusX, height);
    //     gy.call(yAxis, focusY, data.y);
    //     path.attr("d", area(focusX, focusY));
    //   }
    // });

    let focus = d3.select(`#focus svg`);
    if (!focus.size()) focus = d3.select(`#focus`).append("svg");
    focus.attr("viewBox", [0, 0, width, focusHeight]).style("display", "block");

    const brush = d3
      .brushX()
      .extent([
        [margin.left, 0.5],
        [width - margin.right, focusHeight - margin.bottom + 0.5],
      ])
      .on("brush", brushed)
      .on("end", brushended);

    const defaultSelection = [margin.left, x.range()[1] / 10];

    // svg.append("g")
    //     .call(xAxis, x, focusHeight);

    focus
      .append("path")
      .datum(series)
      .attr("stroke", "steelblue")
      .attr("fill", "none")
      .attr("d", line(x, y.copy().range([focusHeight - margin.bottom, 4])));

    const gb = focus
      .append("g")
      .call(brush)
      .call(brush.move, defaultSelection);

    function brushed() {
      if (d3.event.selection) {
        const [minX, maxX] = d3.event.selection.map(x.invert, x);
        const maxY = d3.max(series, d => (minX <= d.date && d.date <= maxX ? d[name] : 0));
        const [focusX, focusY] = [x.copy().domain([minX, maxX]), y];
        console.log("BRUSHED", d3.event.selection, d3.event.selection.map(x.invert, x), minX, maxX, maxY);
        // gx.call(xAxis, focusX, height);
        // gy.call(yAxis, focusY, data.y);
        path.attr("d", line(focusX, focusY));
      }
    }

    function brushended() {
      if (!d3.event.selection) {
        gb.call(brush.move, defaultSelection);
      }
    }

    // We initially generate a SVG group to keep our brushes' DOM elements in:
    var gBrushes = main.append("g").attr("class", "brushes");
    brushes(gBrushes);
  }, 400);

  return (
    <>
      <div id={id}>Hello</div>
      <div id={id + "_focus"}></div>
    </>
  );
};

// const HtxTimeSeriesChannelView = observer(({ store, item }) => <TS series={item._simple} />);
const HtxTimeSeriesChannelViewD3 = observer(({ store, item }) => <D3 name={item.value} series={item._d3} />);

const HtxTimeSeriesChannel = inject("store")(observer(HtxTimeSeriesChannelViewD3));

Registry.addTag("timeserieschannel", TimeSeriesChannelModel, HtxTimeSeriesChannel);

export { TimeSeriesChannelModel, HtxTimeSeriesChannel };
