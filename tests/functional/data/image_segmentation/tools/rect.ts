export const rectangleToolAndLabelsConfig = `<View>
  <Image name="img" value="$image" />
  <Rectangle name="rect" toName="img" />
  <Labels name="labels" toName="img">
    <Label value="Label 1" background="blue" />
    <Label value="Label 2" background="red" />
  </Labels>
 </View>`;

export const simpleImageData = {
  image: 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg',
};

export const simpleRectangleResult = [
  {
    'id': 'rect_1',
    'original_width': 2242,
    'original_height': 2802,
    'image_rotation': 0,
    'value': {
      'x': 20,
      'y': 20,
      'width': 20,
      'height': 20,
      'rotation': 0,
    },
    'from_name': 'rect',
    'to_name': 'img',
    'type': 'rectangle',
    'origin': 'manual',
  },
];
