const config = `
<View>
  <Image name="img" value="$image" zoom="true"></Image>
  <KeyPointLabels name="tag" toName="img" strokewidth="5" fillcolor="red">
    <Label value="Hello" background="yellow"></Label>
    <Label value="World" background="blue"></Label>  
  </KeyPointLabels>
</View>
`;

const data = {
  image:
    "https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg",
};

const result = [
  {
    id: "hqudA4A3U4",
    from_name: "tag",
    to_name: "img",
    image_rotation: 0,
    original_height: 2802,
    original_width: 2242,
    type: "keypointlabels",
    value: {
      x: 49.6,
      y: 52.34042553191489,
      width: 0.6666666666666666,
      keypointlabels: ["Hello"],
    },
  },
  {
    id: "Rz9oHDXIwG",
    from_name: "tag",
    to_name: "img",
    image_rotation: 0,
    original_height: 2802,
    original_width: 2242,
    type: "keypointlabels",
    value: {
      x: 47.73333333333334,
      y: 52.765957446808514,
      width: 0.6666666666666666,
      keypointlabels: ["World"],
    },
  },
];

const title = "Keypoints on Image";

module.exports = { config, data, result, title };
