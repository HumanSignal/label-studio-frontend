/* global Feature, Scenario, locate */
const { initLabelStudio } = require("./helpers");
// const Utils = require("../examples/utils");

const config = ({ timeformat }) => `
<View>
  <Header value="Select regions:"></Header>
  <TimeSeriesLabels name="label" toName="ts">
    <Label value="Beat"></Label>
    <Label value="Voice"></Label>
    <Label value="Guitar"></Label>
    <Label value="Other"></Label>
  </TimeSeriesLabels>
  <TimeSeries name="ts" value="$timeseries" valueType="json" timeColumn="time" format="date" ${timeformat ? `timeFormat="${timeformat}"` : ""} overviewChannels="two">
    <Channel units="Hz" displayFormat=",.1f" strokeColor="#1f77b4" legend="Sensor 1" column="one" />
    <Channel units="Hz" displayFormat=",.1f" strokeColor="#ff7f0e" legend="Sensor 2" column="two" />
  </TimeSeries>
</View>
`;

const scenarios = {
  "Works with data sorted ascending by time column": {
    "timeseries": {
      "time": [
        -1,
        0,
        1,
        2,
        3,
      ],
      "one": [
        13.11794020069087,
        95.21904116667384,
        37.03620982977559,
        16.8961637786484,
        49.2981075645916,
      ],
      "two": [
        -5.653544080516028,
        10.074586491002710,
        0,
        -20.140046051127193,
        32.40194378594322,
      ],
    },
    assert(I) {
      I.waitForVisible(".htx-timeseries", 5);
      I.dontSeeElement(locate(".ls-errors"));
    },
  },

  "Errors with data sorted descending by time column": {
    "timeseries": {
      "time": [
        3,
        2,
        1,
      ],
      "one": [
        37.03620982977559,
        16.8961637786484,
        49.2981075645916,
      ],
      "two": [
        0,
        -20.140046051127193,
        32.40194378594322,
      ],
    },
    assert(I) {
      I.seeElement(locate(".ls-errors"));
    },
  },

  "Errors with data not sorted by time column": {
    "timeseries": {
      "time": [
        1,
        3,
        2,
      ],
      "one": [
        37.03620982977559,
        16.8961637786484,
        49.2981075645916,
      ],
      "two": [
        0,
        -20.140046051127193,
        32.40194378594322,
      ],
    },
    assert(I) {
      I.seeElement(locate(".ls-errors"));
    },
  },

  "Works with data formatted and sorted ascending by time column": {
    "timeformat": "%Y-%m-%d %H:%M:%S",
    "timeseries": {
      "time": [
        "2022-02-07 00:50:00",
        "2022-02-07 00:51:00",
        "2022-02-07 00:52:00",
      ],
      "one": [
        37.03620982977559,
        16.8961637786484,
        49.2981075645916,
      ],
      "two": [
        0,
        -20.140046051127193,
        32.40194378594322,
      ],
    },
    assert(I) {
      I.waitForVisible(".htx-timeseries", 5);
      I.dontSeeElement(locate(".ls-errors"));
    },
  },

  "Errors with data formatted and sorted descending by time column": {
    "timeformat": "%Y-%m-%d %H:%M:%S",
    "timeseries": {
      "time": [
        "2022-02-07 00:52:00",
        "2022-02-07 00:51:00",
        "2022-02-07 00:50:00",
      ],
      "one": [
        37.03620982977559,
        16.8961637786484,
        49.2981075645916,
      ],
      "two": [
        0,
        -20.140046051127193,
        32.40194378594322,
      ],
    },
    assert(I) {
      I.seeElement(locate(".ls-errors"));
    },
  },

  "Errors with data formatted and not sorted by time column": {
    "timeformat": "%Y-%m-%d %H:%M:%S",
    "timeseries": {
      "time": [
        "2022-02-07 00:50:00",
        "2022-02-07 00:52:00",
        "2022-02-07 00:51:00",
      ],
      "one": [
        37.03620982977559,
        16.8961637786484,
        49.2981075645916,
      ],
      "two": [
        0,
        -20.140046051127193,
        32.40194378594322,
      ],
    },
    assert(I) {
      I.seeElement(locate(".ls-errors"));
    },
  },
};

Feature("TimeSeries datasets");
Object.entries(scenarios).forEach(([title, scenario]) =>
  Scenario(title, async function({ I }) {
    const cfg = config(scenario);
    const params = { annotations: [{ id: "test", result: [] }], config: cfg, data: { timeseries: scenario.timeseries } };
    // const configTree = Utils.parseXml(config);

    await I.amOnPage("/");
    await I.executeScript(initLabelStudio, params);

    scenario.assert(I);
  }));
