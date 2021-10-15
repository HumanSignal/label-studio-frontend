const config = `
<View>
  <Image name="img" value="$image"></Image>
  <RectangleLabels name="tag" toName="img" fillOpacity="0.5" strokeWidth="5">
    <Label value="Planet"></Label>
    <Label value="Moonwalker" background="blue"></Label>
  </RectangleLabels>
</View>
`;

const data = {
  image:
    "/images/astro-visuals.jpg",
};

const result = [
  {
    from_name: "tag",
    id: "Dx_aB91ISN",
    image_rotation: 0,
    original_height: 2802,
    original_width: 2242,
    to_name: "img",
    type: "rectanglelabels",
    value: {
      height: 10.458911419423693,
      rectanglelabels: ["Moonwalker"],
      rotation: 0,
      width: 12.4,
      x: 50.8,
      y: 5.869797225186766,
    },
  },
];

const title = "BBoxes on Image";

module.exports = { config, data, result, title };
