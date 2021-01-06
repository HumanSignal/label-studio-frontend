const config = `
<View>
  <Header value="Time Series from CSV"
          style="font-weight: normal"/>

  <TimeSeriesLabels name="label" toName="ts">
    <Label value="Run" background="#5b5"/>
    <Label value="Walk" background="#55f"/>
  </TimeSeriesLabels>

  <TimeSeries name="ts" valueType="url"
              timeColumn="time" value="$csv"
              sep="," overviewChannels="velocity">
    <Channel column="velocity" strokeColor="#1f77b4"/>
    <Channel column="acceleration" strokeColor="#ff7f0e"/>
  </TimeSeries>
</View>
`;

const data = {
  csv: "https://app.heartex.ai/samples/time-series.csv?time=time&values=velocity%2Cacceleration&sep=%2C",
};

const result = [
  {
    value: {
      start: 4,
      end: 23,
      instant: false,
      timeserieslabels: ["Run"],
    },
    id: "Oek-tTCZ6_",
    from_name: "label",
    to_name: "ts",
    type: "timeserieslabels",
  },
  {
    value: {
      start: 52,
      end: 69,
      instant: false,
      timeserieslabels: ["Walk"],
    },
    id: "U0S2_cORxv",
    from_name: "label",
    to_name: "ts",
    type: "timeserieslabels",
  },
];

const title = "TimeSeries csv loaded by url with index column";

module.exports = { config, data, result, title };
