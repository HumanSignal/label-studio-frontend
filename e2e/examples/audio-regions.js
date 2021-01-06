const config = `
<View>
  <Header value="Select regions:"></Header>
  <Labels name="label" toName="audio" choice="multiple">
    <Label value="Beat" background="yellow"></Label>
    <Label value="Voice" background="red"></Label>
    <Label value="Guitar" background="blue"></Label>
    <Label value="Other"></Label>
  </Labels>
  <Header value="Select genre:"></Header>
  <Choices name="choice" toName="audio" choice="multiple">
    <Choice value="Lo-Fi" />
    <Choice value="Rock" />
    <Choice value="Pop" />
  </Choices>
  <Header value="Listen the audio:"></Header>
  <AudioPlus name="audio" value="$url"></AudioPlus>
</View>
`;

const data = {
  url: "https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/audio/barradeen-emotional.mp3",
};

const result = [
  {
    from_name: "choice",
    id: "hIj6zg57SY",
    to_name: "audio",
    type: "choices",
    value: {
      choices: ["Lo-Fi"],
    },
  },
  {
    from_name: "label",
    id: "SsGrpVgy_C",
    to_name: "audio",
    original_length: 98.719925,
    type: "labels",
    value: {
      end: 28.50568583621215,
      labels: ["Beat"],
      start: 12.778410892095105,
    },
  },
  {
    from_name: "label",
    id: "JhxupEJWlW",
    to_name: "audio",
    original_length: 98.719925,
    type: "labels",
    value: {
      end: 59.39854733358493,
      labels: ["Other"],
      start: 55.747572792986325,
    },
  },
];

const title = "Audio regions";

module.exports = { config, data, result, title };
