import * as d3 from "d3";
import Utils from "../../../utils";

export const line = (x, y) =>
  d3
    .line()
    .x(d => x(d[0]))
    .y(d => y(d[1]));

export const idFromValue = value => value.substr(1);

export const getOptimalWidth = () => ((window.screen && window.screen.width) || 1440) * (window.devicePixelRatio || 2);

export const sparseValues = (values, max = 10e6) => {
  if (values.length <= max) return values;
  let next = 0;
  let step = (values.length - 1) / (max - 1);
  // return values.filter((_, i) => i > next && (next += step))
  return values.filter((_, i) => {
    if (i < next) return false;
    next += step;
    return true;
  });
};

export const getRegionColor = (region, alpha = 1) => {
  const stateProvidesColor = region.states.find(s => s.hasOwnProperty("getSelectedColor"));
  const color = Utils.Colors.convertToRGBA(stateProvidesColor.getSelectedColor(), alpha);
  return color;
};

// fixes `observe` - it watches only the changes of primitive props of observables count
// so pass all the required primitives to this stub and they'll be observed
export const fixMobxObserve = (...args) => {};

const formatDateDiff = (start, end) => {
  const dates = [start.toISOString(), end.toISOString()];
  let ds = dates.map(d => d.substr(0, 10));
  if (ds[1] !== ds[0]) return ds;
  return dates.map(d => d.substr(11, 8));
};

export const formatRegion = node => {
  let ranges = [];
  if (node.parent.format === "date") {
    ranges = formatDateDiff(new Date(node.start), new Date(node.end));
  } else {
    ranges = [node.start, node.end];
  }
  return node.instant ? ranges[0] : ranges.join("–");
};

export const formatTrackerTime = time =>
  new Date(time)
    .toISOString()
    .substr(0, 19)
    .replace("T", " ");
