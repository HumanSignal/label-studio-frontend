/* eslint-disable react-hooks/exhaustive-deps */

import React from "react";
import * as d3 from "d3";
import { observer, inject } from "mobx-react";
import { types, getRoot, getType } from "mobx-state-tree";
import throttle from "lodash.throttle";

import ObjectBase from "./Base";
import ObjectTag from "../../components/Tags/Object";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import Types from "../../core/Types";
import { restoreNewsnapshot } from "../../core/Helpers";
import {
  checkD3EventLoop,
  idFromValue,
  getRegionColor,
  fixMobxObserve,
  formatTrackerTime,
  sparseValues,
  getOptimalWidth,
} from "./TimeSeries/helpers";
import { parseCSV, tryToParseJSON } from "../../utils/data";
import messages from "../../utils/messages";
import { errorBuilder } from "../../core/DataValidator/ConfigValidator";
import PersistentStateMixin from "../../mixins/PersistentState";

import "./TimeSeries/Channel";

/**
 * TimeSeries tag can be used to label time series data.
 * Read more about Time Series Labeling on [template page](../templates/time_series.html).
 * @example
 * <!-- csv loaded by url in `value` with 3 columns: time, sensor1, sensor2 -->
 * <!-- key column `time` is a number actually -->
 * <View>
 *   <TimeSeries name="device" value="$timeseries" valueType="url" timeColumn="time">
 *      <Channel column="sensor1" />
 *      <Channel column="sensor2" />
 *   </TimeSeries>
 * </View>
 * @example
 * <!-- data stored directly in task's field `ts` as json -->
 * <!-- timeseries key (`time`) is date in `timeFormat` formatted as full date on plot (by default) -->
 * <View>
 *   <TimeSeries name="device" value="$ts" timeColumn="time" timeFormat="%m/%d/%Y %H:%M:%S">
 *      <Channel column="sensor1" />
 *      <Channel column="sensor2" />
 *   </TimeSeries>
 * </View>
 * @name TimeSeries
 * @param {string} name name of the element
 * @param {string} value key used to lookup the data, it needs to reference either URLs for your time-series if valueType=url, otherwise expects JSON
 * @param {enum} [valueType] "url" or "json" If set to "url" then it loads value references inside `value` key, otherwise it expects JSON. Defaults to url
 * @param {string} [timeColumn] column name or index that provides temporal values, if your time-series data has no temporal column then its automatically generated
 * @param {string} [timeFormat] pattern used to parse values inside timeColumn, parsing provided by d3, and follows `strftime` implementation
 * @param {string} [timeDisplayFormat] format used to display temporal value, can be a number or a date, if a temporal column is a date then use strftime to format it, otherwise, if it's a number then use [d3 number](https://github.com/d3/d3-format#locale_format) formatting
 * @param {string} [sep] separator for you CSV file, default is comma ","
 * @param {string} [overviewChannels] comma-separated list of channels names or indexes displayed in overview
 */
const TagAttrs = types.model({
  name: types.identifier,
  value: types.string,
  valuetype: types.optional(types.enumeration(["url", "json"]), "url"),
  timecolumn: "",

  sep: ",",
  timeformat: "",
  timedisplayformat: "",
  overviewchannels: "", // comma-separated list of channels to show

  multiaxis: types.optional(types.boolean, false), // show channels in the same view
  // visibilitycontrols: types.optional(types.boolean, false), // show channel visibility controls
  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model("TimeSeriesModel", {
    type: "timeseries",
    children: Types.unionArray(["channel", "timeseriesoverview", "view", "hypertext"]),

    width: 840,
    margin: types.frozen({ top: 20, right: 20, bottom: 30, left: 50, min: 10, max: 10 }),
    brushRange: types.array(types.number),

    // _value: types.optional(types.string, ""),
    _needsUpdate: types.optional(types.number, 0),
  })
  .volatile(self => ({
    data: null,
    valueLoaded: false,
    zoomedRange: 0,
    scale: 1,
    headers: [],
  }))
  .views(self => ({
    get regionsTimeRanges() {
      return self.regs.map(r => {
        return [r.start, r.end];
      });
    },

    get store() {
      return getRoot(self);
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get regs() {
      return self.completion.regionStore.regions.filter(r => r.object === self);
    },

    get isDate() {
      return Boolean(self.timeformat) || (self.timedisplayformat && /[a-zA-Z]/.test(self.timedisplayformat[0]));
    },

    get keyColumn() {
      // for virtual column use just an uniq random name to not overlap with other column names
      return (self.timecolumn || "#@$").toLowerCase();
    },

    get parseTimeFn() {
      return self.timeformat && self.timecolumn ? d3.timeParse(self.timeformat) : Number;
    },

    parseTime(time) {
      const parse = self.parseTimeFn;
      return +parse(time);
    },

    get dataObj() {
      if (!self.valueLoaded || !self.data) return null;
      let data = self.data;
      if (!self.timecolumn) {
        const justAnyColumn = Object.values(data)[0];
        const indices = Array.from({ length: justAnyColumn.length }, (_, i) => i);
        data = { ...data, [self.keyColumn]: indices };
      } else if (self.timeformat) {
        const timestamps = data[self.keyColumn].map(self.parseTime);
        data = { ...data, [self.keyColumn]: timestamps };
      }
      return data;
    },

    get dataHash() {
      const raw = self.dataObj;
      const { keyColumn } = self;
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
          if (!self.timecolumn) data[i][keyColumn] = i;
        }
      }
      return data;
    },

    get slicesCount() {
      return 10;
    },

    get dataSlices() {
      // @todo it should make it `computed` automatically
      if (self.slices) return self.slices;
      const count = self.slicesCount;
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

    // range of times or numerical indices
    get keysRange() {
      const keys = self.dataObj?.[self.keyColumn];
      if (!keys) return [];
      return [keys[0], keys[keys.length - 1]];
    },

    get persistentValues() {
      return {
        brushRange: self.brushRange,
        initialRange: self.initialRange,
        // @todo as usual for rerender
        scale: self.scale + 0.0001,
      };
    },

    states() {
      return self.completion.toNames.get(self.name);
    },

    activeStates() {
      const states = self.states();
      return states ? states.filter(s => s.isSelected && getType(s).name === "TimeSeriesLabelsModel") : null;
    },

    formatTime(time) {
      if (!self._format) {
        const { timedisplayformat: format, isDate } = self;
        if (format === "date") self._format = formatTrackerTime;
        else if (format) self._format = isDate ? d3.timeFormat(format) : d3.format(format);
        else self._format = String;
      }
      return self._format(time);
    },
  }))

  .actions(self => ({
    setData(data) {
      self.data = data;
      self.valueLoaded = true;
    },

    setColumnNames(headers) {
      self.headers = headers;
    },

    setZoomedRange(range) {
      self.zoomedRange = range;
    },

    setScale(scale) {
      self.scale = scale;
    },

    updateView() {
      self._needsUpdate = self._needsUpdate + 1;
    },

    scrollToRegion(r) {
      const range = [...self.brushRange];
      if (r.start >= range[0] && r.end <= range[1]) return;
      const currentSize = range[1] - range[0];
      const regionSize = r.end - r.start;
      const desiredSize = regionSize * 1.5;
      const gap = (desiredSize - regionSize) / 2;
      if (currentSize < desiredSize) {
        const extend = (desiredSize - currentSize) / 2;
        range[0] -= extend;
        range[1] += extend;
      }
      // just move without resize
      if (r.start < range[0]) {
        range[1] -= range[0] - (r.start - gap);
        range[0] = r.start - gap;
      }
      if (r.end > range[1]) {
        range[0] += r.end + gap - range[1];
        range[1] = r.end + gap;
      }
      // constrain to domain
      range[0] = Math.max(self.keysRange[0], range[0]);
      range[1] = Math.min(self.keysRange[1], range[1]);
      // @todo dirty hack to trigger rerender, rewrite
      self.updateTR(range, self.scale + 0.0001);
    },

    updateTR(tr, scale = 1) {
      if (tr === null) return;

      self.initialRange = tr;
      self.brushRange = tr;
      self.setZoomedRange(tr[1] - tr[0]);
      self.setScale(scale);
      self.updateView();
    },

    throttledRangeUpdate() {
      return throttle(self.updateTR, 100);
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

    addRegion(start, end, predefinedStates) {
      const states = self.getAvailableStates();
      if (states.length === 0) return;
      const control = states[0];
      const labels = { [control.valueType]: control.selectedValues() };

      // const r = self.createRegion(start, end, clonedStates);
      const r = self.completion.createResult({ start, end, instant: start === end }, labels, control, self);

      return r;
    },

    regionChanged(timerange, i, activeStates) {
      const r = self.regs[i];
      let needUpdate = false;

      if (!r) {
        self.addRegion(timerange.start, timerange.end, activeStates);
        needUpdate = true;
      } else {
        needUpdate = r.start !== timerange.start || r.end !== timerange.end;
        r.updateRegion(timerange.start, timerange.end);
      }
      needUpdate && self.updateView();
    },

    async preloadValue(store) {
      const dataObj = store.task.dataObj;

      if (self.valuetype !== "url") {
        if (self.value) {
          self.setData(dataObj[idFromValue(self.value)]);
        } else {
          self.setData(dataObj);
        }
        return;
      }

      if (!self.value) {
        const message = `Attribute <b>value</b> for <b>${self.name}</b> should be provided when <b>valuetype="url"</b>`;
        store.completionStore.addErrors([errorBuilder.generalError(message)]);
        return;
      }
      const url = dataObj[idFromValue(self.value)];
      if (!url || typeof url !== "string") {
        const message = `Cannot find url in <b>${idFromValue(self.value)}</b> field of your task`;
        store.completionStore.addErrors([errorBuilder.generalError(message)]);
        return;
      }
      let text = "";
      let cors = false;
      let res;

      try {
        res = await fetch(url);
        if (!res.ok) {
          if (res.status === 400) {
            store.completionStore.addErrors([
              errorBuilder.loadingError(`${res.status} ${res.statusText}`, url, self.value, messages.ERR_LOADING_S3),
            ]);
            return;
          }
          throw new Error(`${res.status} ${res.statusText}`);
        }
        text = await res.text();
      } catch (e) {
        let error = e;
        if (!res) {
          try {
            res = await fetch(url, { mode: "no-cors" });
            if (!res.ok && res.status === 0) cors = true;
          } catch (e) {
            error = e;
          }
        }
        store.completionStore.addErrors([
          errorBuilder.loadingError(error, url, self.value, cors ? messages.ERR_LOADING_CORS : undefined),
        ]);
        return;
      }

      try {
        let data = tryToParseJSON(text);
        let headers = [];
        if (!data) {
          let separator = self.sep;
          if (separator?.length > 1) {
            const aliases = { tab: "\t", "\\t": "\t", space: " ", auto: "auto", comma: ",", dot: "." };
            separator = aliases[separator] || separator[0];
          }
          [data, headers] = parseCSV(text, separator);
        }
        self.setData(data);
        self.setColumnNames(headers);
        self.updateValue(store);
      } catch (e) {
        const message = `Problems with parsing CSV: ${e?.message || e}<br>URL: ${url}`;
        store.completionStore.addErrors([errorBuilder.generalError(message)]);
      }
    },

    async updateValue(store) {
      if (!self.dataObj) {
        await self.preloadValue(store);
      }
      const data = self.dataObj;
      if (!data) return;
      const times = data[self.keyColumn];
      if (!times) {
        const message = [
          `<b>${self.keyColumn}</b> not found in data.`,
          `Use <b>valueType="url"</b> for data loading or column index for headless csv`,
        ].join(" ");
        store.completionStore.addErrors([errorBuilder.generalError(message)]);
        return;
      }
      // if current view already restored by PersistentState
      if (self.brushRange.length) return;
      self.updateTR([times[0], times[times.length >> 2]]);
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
const Overview = observer(({ item, data, series, range, forceUpdate }) => {
  const regions = item.regs;
  const [ref, fullWidth, node] = useWidth();

  const focusHeight = 60;
  const { margin, keyColumn: idX } = item;
  const width = fullWidth - margin.left - margin.right;
  // const data = store.task.dataObj;
  let keys = item.children.map(c => c.columnName);
  if (item.overviewchannels) {
    const channels = item.overviewchannels
      .toLowerCase()
      .split(",")
      .map(name => (/^\d+$/.test(name) ? item.headers[name] : name))
      .filter(ch => keys.includes(ch));
    if (channels.length) keys = channels;
  }
  // const series = data[idX];
  const minRegionWidth = 2;

  const focus = React.useRef();
  const gRegions = React.useRef();
  const gChannels = React.useRef();
  const gAxis = React.useRef();
  const gb = React.useRef();

  const scale = item.isDate ? d3.scaleTime() : d3.scaleLinear();
  const x = scale.domain(d3.extent(data[idX])).range([0, width]);

  const upd = React.useCallback(item.throttledRangeUpdate(), []);

  const defaultSelection = [0, width >> 2];
  const prevBrush = React.useRef(defaultSelection);
  const MIN_OVERVIEW = 10;

  function brushed() {
    if (d3.event.selection && !checkD3EventLoop("brush") && !checkD3EventLoop("wheel")) {
      let [x1, x2] = d3.event.selection;
      const prev = prevBrush.current;
      const overviewWidth = x2 - x1;
      let start = +x.invert(x1);
      let end = +x.invert(x2);
      // if overview is left intact do nothing
      if (prev[0] === x1 && prev[1] === x2) {
      }
      // if overview was moved; precision comparison for floats
      else if (prev[0] !== x1 && prev[1] !== x2 && Math.abs(overviewWidth - MIN_OVERVIEW) < 0.001) {
        const mid = (start + end) / 2;
        start = mid - item.zoomedRange / 2;
        end = mid + item.zoomedRange / 2;
        // if overview was resized
      } else if (overviewWidth < MIN_OVERVIEW) {
        if (prev[0] === x1) {
          x2 = Math.min(width, x1 + MIN_OVERVIEW);
        } else if (prev[1] === x2) {
          x1 = Math.max(0, x2 - MIN_OVERVIEW);
        }
        // change the data range, but keep min-width for overview
        gb.current.call(brush.move, [x1, x2]);
      }
      prevBrush.current = [x1, x2];
      upd([start, end]);
    }
  }

  function brushended() {
    if (!d3.event.selection) {
      // move selection on click; try to preserve it's width
      const center = d3.mouse(this)[0];
      const range = item.brushRange.map(x);
      const half = (range[1] - range[0]) >> 1;
      let moved = [center - half, center + half];
      if (moved[0] < 0) moved = [0, half * 2];
      if (moved[1] > width) moved = [width - half * 2, width];
      gb.current.call(brush.move, moved);
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
    const channel = item.children.find(c => c.columnName === key);
    const color = channel ? channel.strokecolor : "steelblue";
    const y = d3
      .scaleLinear()
      .domain([d3.min(data[key]), d3.max(data[key])])
      .range([focusHeight - margin.max, margin.min]);

    gChannels.current
      .append("path")
      .datum(sparseValues(series, getOptimalWidth()))
      .attr("class", "channel")
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
    gAxis.current.call(
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

    gAxis.current = focus.current.append("g").attr("transform", `translate(0,${focusHeight})`);

    gChannels.current = focus.current.append("g").attr("class", "channels");

    gRegions.current = focus.current.append("g").attr("class", "regions");

    gb.current = focus.current
      .append("g")
      .call(brush)
      .call(brush.move, defaultSelection);
    // give a bit more space for brush moving
    gb.current.select(".handle--w").style("transform", "translate(-1px, 0)");
    gb.current.select(".handle--e").style("transform", "translate(1px, 0)");
  }, [node]);

  React.useEffect(() => {
    if (node) {
      d3.select(node)
        .selectAll("svg")
        .attr("viewBox", [0, 0, width + margin.left + margin.right, focusHeight + margin.bottom]);

      gChannels.current.selectAll("path").remove();
      for (let key of keys) drawPath(key);

      drawAxis();
      // gb.current.selectAll("*").remove();
      gb.current.call(brush).call(brush.move, item.brushRange.map(x));
    }
  }, [width, node]);

  // redraw overview on zoom
  React.useEffect(() => {
    if (!gb.current) return;
    const range = item.brushRange.map(x);
    if (range[1] - range[0] < MIN_OVERVIEW) {
      const mid = (range[1] + range[0]) / 2;
      range[0] = Math.max(0, mid - MIN_OVERVIEW / 2);
      range[1] = Math.min(width, mid + MIN_OVERVIEW / 2);
    }
    prevBrush.current = range;
    gb.current.call(brush.move, range);
  }, [item.scale]); // the only parameter changes on zoom only

  React.useEffect(() => {
    node && drawRegions(regions);
  });

  item.regs.map(r => fixMobxObserve(r.start, r.end, r.selected, r.style.fillcolor));

  return <div className="htx-timeseries-overview" ref={ref} />;
});

const HtxTimeSeriesViewRTS = ({ store, item }) => {
  console.log("TS", item.brushRange, item);
  const ref = React.createRef();

  React.useEffect(() => {
    if (item && item.brushRange.length) {
      item._nodeReference = ref.current;
    }
  }, [item, ref]);

  // the last thing updated during initialisation
  if (!item.brushRange.length || !item.data) return null;

  return (
    <div ref={ref} className="htx-timeseries">
      <ObjectTag item={item}>
        {Tree.renderChildren(item)}
        <Overview data={item.dataObj} series={item.dataHash} item={item} range={item.brushRange} />
      </ObjectTag>
    </div>
  );
};

const TimeSeriesModel = types.compose("TimeSeriesModel", ObjectBase, PersistentStateMixin, TagAttrs, Model);
const HtxTimeSeries = inject("store")(observer(HtxTimeSeriesViewRTS));

Registry.addTag("timeseries", TimeSeriesModel, HtxTimeSeries);
Registry.addObjectType(TimeSeriesModel);

export { TimeSeriesModel, HtxTimeSeries };
