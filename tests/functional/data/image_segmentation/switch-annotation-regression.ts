export const fourToolsConfig = `
  <View>
    <Image name="img" value="$image"></Image>
    <Rectangle name="r" toName="img"/>
    <Ellipse name="e" toName="img"/>
    <Polygon name="p" toName="img"/>
    <KeyPoint name="k" toName="img"/>
  </View>
`;

export const simpleImageData = {
  image: 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg',
};

export const fourToolsResult = [
  {
    'original_width': 2242,
    'original_height': 2802,
    'image_rotation': 0,
    'value': {
      'x': 4.070796460176991,
      'y': 4.2492917847025495,
      'width': 9.026548672566372,
      'height': 9.206798866855522,
      'rotation': 0,
    },
    'id': 'wFL6nEJpmv',
    'from_name': 'r',
    'to_name': 'img',
    'type': 'rectangle',
    'origin': 'manual',
  },
  {
    'original_width': 2242,
    'original_height': 2802,
    'image_rotation': 0,
    'value': {
      'x': 21.946902654867255,
      'y': 8.498583569405099,
      'radiusX': 4.778761061946903,
      'radiusY': 4.2492917847025495,
      'rotation': 0,
    },
    'id': 'bQktnc3uW2',
    'from_name': 'e',
    'to_name': 'img',
    'type': 'ellipse',
    'origin': 'manual',
  },
  {
    'original_width': 2242,
    'original_height': 2802,
    'image_rotation': 0,
    'value': {
      'points': [
        [
          5.132743362831858,
          16.71388101983003,
        ],
        [
          12.389380530973451,
          16.71388101983003,
        ],
        [
          11.327433628318584,
          22.662889518413603,
        ],
        [
          4.601769911504425,
          19.971671388101978,
        ],
      ],
    },
    'id': 'NnZXqAu2em',
    'from_name': 'p',
    'to_name': 'img',
    'type': 'polygon',
    'origin': 'manual',
  },
  {
    'original_width': 2242,
    'original_height': 2802,
    'image_rotation': 0,
    'value': {
      'x': 22.300884955752213,
      'y': 18.838526912181305,
      'width': 0.35398230088495575,
    },
    'id': 'Cq_T933Efd',
    'from_name': 'k',
    'to_name': 'img',
    'type': 'keypoint',
    'origin': 'manual',
  },
];