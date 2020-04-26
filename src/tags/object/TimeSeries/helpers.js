import * as d3 from "d3";
import Utils from "../../../utils";

export const line = (x, y) =>
  d3
    .line()
    .x(d => x(d[0]))
    .y(d => y(d[1]));

export const idFromValue = value => value.substr(1);

export const getRegionColor = (region, alpha = 1) => {
  const stateProvidesColor = region.states.find(s => s.hasOwnProperty("getSelectedColor"));
  const color = Utils.Colors.convertToRGBA(stateProvidesColor.getSelectedColor(), alpha);
  return color;
};

// fixes `observe` - it watches only the changes of primitive props of observables count
// so pass all the required primitives to this stub and they'll be observed
export const fixMobxObserve = (...args) => {};
