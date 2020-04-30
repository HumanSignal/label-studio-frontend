import "moment-duration-format";
import React from "react";
import * as d3 from "d3";
import { observer, inject } from "mobx-react";
import { types, getRoot, getType } from "mobx-state-tree";
import { throttle } from "throttle-debounce";

import ObjectTag from "../../components/Tags/Object";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import Types from "../../core/Types";
import { TimeSeriesChannelModel } from "./TimeSeries/Channel";
import { TimeSeriesRegionModel } from "../../regions/TimeSeriesRegion";
import { cloneNode } from "../../core/Helpers";
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";
import { runTemplate } from "../../core/Template";
import { idFromValue, getRegionColor, fixMobxObserve, sparseValues, getOptimalWidth } from "./TimeSeries/helpers";
import { parse } from "date-fns";

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
    margin: types.frozen({ top: 20, right: 20, bottom: 30, left: 50, min: 10, max: 10 }),
    brushRange: types.array(types.Date),

    inputformat: "",
    format: "",
    overviewchannels: "", // comma-separated list of channels to show

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

    get isDate() {
      return Boolean(self.inputformat) || (self.format && /[a-zA-Z]/.test(self.format[0]));
    },

    get dataObj() {
      let data = self.store.task.dataObj;
      if (self.inputformat) {
        const D = new Date();
        const key = idFromValue(self.value);
        const timestamps = data[key].map(d => +parse(d, self.inputformat, D));
        data = { ...data, [key]: timestamps };
      }
      return data;
    },

    get dataHash() {
      const raw = self.dataObj;
      if (!raw) return null;
      const keys = Object.keys(raw);
      const data = [];

      for (let key of keys) {
        for (let i = 0; i < raw[key].length; i++) {
          if (!data[i]) {
            data[i] = { [key]: raw[key][i] };
          } else {
            data[i][key] = raw[key][i];
          }
        }
      }
      return data;
    },

    get dataSlices() {
      // @todo it should make it `computed` automatically
      if (self.slices) return self.slices;
      // @todo change that from outside
      const count = 10;
      const data = self.dataHash;
      const slice = Math.floor(data.length / count);
      const slices = [];

      for (let i = 0; i < count - 1; i++) {
        slices[i] = data.slice(slice * i, slice * i + slice + 1);
      }
      slices.push(data.slice(slice * (count - 1)));
      self.slices = slices;
      return slices;
    },

    states() {
      return self.completion.toNames.get(self.name);
    },

    activeStates() {
      const states = self.states();
      return states ? states.filter(s => s.isSelected && getType(s).name === "TimeSeriesLabelsModel") : null;
    },
  }))

  .actions(self => ({
    updateView() {
      self._needsUpdate = self._needsUpdate + 1;
    },

    updateTR(tr) {
      if (tr === null) return;

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

    toStateJSON() {
      return self.regions.map(r => r.toStateJSON());
    },

    createRegion(start, end, states) {
      const r = TimeSeriesRegionModel.create({
        start: start,
        end: end,
        instant: start === end,
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
      const times = self.dataObj[idFromValue(self.value)];
      self.initialRange = [times[0], times[times.length >> 2]];
      self.brushRange = [times[0], times[times.length >> 2]];
    },

    onHotKey() {},
  }));

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

function useWidth() {
  const [width, setWidth] = React.useState(840);
  const [node, setNode] = React.useState(null);

  const ref = React.useCallback(node => {
    setNode(node);
  }, []);

  React.useLayoutEffect(() => {
    if (node) {
      const measure = () =>
        // window.requestAnimationFrame(() =>
        setWidth(node.offsetWidth);
      // );
      measure();

      window.addEventListener("resize", measure);

      return () => {
        window.removeEventListener("resize", measure);
      };
    }
  }, [node]);

  return [ref, width, node];
}

// class TimeSeriesOverviewD3 extends React.Component {
const Overview = ({ item, data, series, regions, forceUpdate }) => {
  const [ref, fullWidth, node] = useWidth();

  const focusHeight = 60;
  const { margin, value } = item;
  const width = fullWidth - margin.left - margin.right;
  const idX = idFromValue(value);
  // const data = store.task.dataObj;
  const keys = item.overviewchannels ? item.overviewchannels.split(",") : Object.keys(data).filter(key => key !== idX);
  // const series = data[idX];
  const minRegionWidth = 2;

  const focus = React.useRef();
  const gRegions = React.useRef();
  const gb = React.useRef();

  const scale = item.isDate ? d3.scaleTime() : d3.scaleLinear();
  const x = scale.domain(d3.extent(data[idX])).range([0, width]);

  const upd = React.useCallback(throttle(300, item.updateTR));

  function brushed() {
    if (d3.event.selection) {
      const [start, end] = d3.event.selection.map(x.invert, x);
      upd([start, end]);
    }
  }

  function brushended() {
    if (!d3.event.selection) {
      // move selection on click; try to preserve it's width
      const center = d3.mouse(this)[0];
      const range = item.brushRange.map(x);
      const half = (range[1] - range[0]) >> 1;
      gb.current.call(brush.move, [Math.max(center - half, 0), Math.min(width, center + half)]);
    }
  }

  const brush = d3
    .brushX()
    .extent([
      [0, 0],
      [width, focusHeight],
    ])
    .on("brush", brushed)
    .on("end", brushended);

  const drawPath = key => {
    const channel = item.children.find(c => c.value === `$${key}`);
    const color = channel ? channel.strokecolor : "steelblue";
    const y = d3
      .scaleLinear()
      .domain([d3.min(data[key]), d3.max(data[key])])
      .range([focusHeight - margin.max, margin.min]);

    focus.current
      .append("path")
      .datum(sparseValues(series, getOptimalWidth()))
      .attr("fill", "none")
      .attr("stroke", color)
      .attr(
        "d",
        d3
          .line()
          .y(d => y(d[key]))
          .defined(d => d[idX])
          .x(d => x(d[idX])),
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
      .attr("width", r => Math.max(minRegionWidth, x(r.end) - x(r.start)))
      .attr("fill", r => getRegionColor(r, r.selected ? 0.8 : 0.3));
    rSelection.exit().remove();
  };

  const drawAxis = () => {
    focus.current
      .append("g")
      .attr("transform", `translate(0,${focusHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(width / 80)
          .tickSizeOuter(0),
      );
  };

  React.useEffect(() => {
    if (!node) return;

    focus.current = d3
      .select(node)
      .append("svg")
      .attr("viewBox", [0, 0, width + margin.left + margin.right, focusHeight + margin.bottom])
      .style("display", "block")
      .append("g")
      .attr("transform", "translate(" + margin.left + ",0)");

    for (let key of keys) drawPath(key);

    drawAxis();

    gRegions.current = focus.current.append("g").attr("class", "regions");

    const defaultSelection = [0, width >> 2];

    gb.current = focus.current
      .append("g")
      .call(brush)
      .call(brush.move, defaultSelection);
  }, [node]);

  React.useEffect(() => {
    if (node) {
      focus.current.attr("viewBox", [0, 0, width + margin.left + margin.right, focusHeight + margin.bottom]);
    }
  }, [width, node]);

  React.useEffect(() => {
    node && drawRegions(regions);
  });

  item.regions.map(r => fixMobxObserve(r.start, r.end, r.selected));

  return <div ref={ref} />;
};

const HtxTimeSeriesViewRTS = observer(({ store, item }) => {
  return (
    <ObjectTag item={item}>
      {Tree.renderChildren(item)}
      <Overview
        data={item.dataObj}
        series={item.dataHash}
        item={item}
        regions={item.regions}
        forceUpdate={item._needsUpdate}
      />
    </ObjectTag>
  );
});

const TimeSeriesModel = types.compose("TimeSeriesModel", TagAttrs, Model);
const HtxTimeSeries = inject("store")(observer(HtxTimeSeriesViewRTS));

Registry.addTag("timeseries", TimeSeriesModel, HtxTimeSeries);

export { TimeSeriesModel, HtxTimeSeries };
