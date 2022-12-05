const config = `
<View>
  <Image name="img" value="$image" showMousePos="true" zoom="true"></Image>
  <PolygonLabels name="tag" toName="img" strokewidth="5" fillcolor="red" pointstyle="circle" pointsize="small">
    <Label value="Hello" background="red"></Label>
    <Label value="World" background="blue"></Label>
  </PolygonLabels>
</View>
`;

const data = {
  image: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg',
};

const result = [
  {
    id: 'XSMXwwsaTa',
    from_name: 'tag',
    to_name: 'img',
    image_rotation: 0,
    original_height: 4542,
    original_width: 10109,
    type: 'polygonlabels',
    origin: 'manual',
    value: {
      points: [
        [27.2, 41.24629080118693],
        [25.733333333333327, 70.62314540059347],
        [48.13333333333333, 62.61127596439168],
        [48.13333333333333, 32.93768545994065],
      ],
      polygonlabels: ['Hello'],
    },
  },
];

const title = 'Polygons on Image';

module.exports = { config, data, result, title };
