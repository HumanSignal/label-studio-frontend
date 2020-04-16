import * as d3 from "d3";

export const line = (x, y) =>
  d3
    .line()
    .x(d => x(d[0]))
    .y(d => y(d[1]));

export const idFromValue = value => value.substr(1);
