export const simpleImageConfig = `<View>
  <Image name="image" value="$image"/>
  <RectangleLabels name="label" toName="image">
    <Label value="Region" background="yellow" />
  </RectangleLabels>
</View>`;

export const imageConfigWithRelations = `<View>
  <Image name="image" value="$image"/>
  <RectangleLabels name="label" toName="image">
    <Label value="Region" background="yellow" />
  </RectangleLabels>
  <Relations>
    <Relation value="Blue label" background="blue"/>
    <Relation value="Red label" background="red"/>
    <Relation value="Green label" background="green"/>
  </Relations>
</View>`;

export const simpleImageData = {
  image: 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg',
};

function rectangleResult(id, x, y, width, height, labels = ['Region']) {
  return {
    'id': id.toString(),
    'from_name': 'label',
    'to_name': 'image',
    'original_width': 2242,
    'original_height': 2802,
    'image_rotation': 0,
    'type': 'rectanglelabels',
    'value': {
      x,
      y,
      width,
      height,
      'rotation': 0,
      'rectanglelabels': ['Region'],
    },
  };
}

function relationResult(fromId, toId, direction = 'right', labels = []) {
  return {
    'from_id': fromId,
    'to_id': toId,
    'type': 'relation',
    direction,
    labels,
  };
}

export const simpleImageResult = [
  rectangleResult('Id_1', 20, 20, 20, 20),
  rectangleResult('Id_2', 50, 50, 30, 30),
];

export const simpleImageResultWithRelation = [
  rectangleResult('Id_1', 20, 20, 20, 20),
  rectangleResult('Id_2', 50, 50, 30, 30),
  relationResult('Id_1', 'Id_2'),
];

export const simpleImageResultWithRelations = [
  rectangleResult('Id_1', 5, 5, 5, 5),
  rectangleResult('Id_2', 15, 5, 5, 5),
  rectangleResult('Id_3', 10, 15, 5, 5),
  rectangleResult('Id_4', 20, 15, 5, 5),
  rectangleResult('Id_5', 15, 25, 5, 5),
  rectangleResult('Id_6', 25, 25, 5, 5),
  relationResult('Id_1', 'Id_2'),
  relationResult('Id_3', 'Id_4', 'left'),
  relationResult('Id_5', 'Id_6', 'bi'),
];

export const simpleImageResultWithRelationsAndLabels = [
  rectangleResult('Id_1', 5, 5, 5, 5),
  rectangleResult('Id_2', 25, 25, 5, 5),
  relationResult('Id_1', 'Id_2', 'right', ['Blue label', 'Red label']),
];

export const simpleImageResultWithRelationsAndLabelsAlt = [
  rectangleResult('Id_1', 5, 5, 5, 5),
  rectangleResult('Id_2', 25, 25, 5, 5),
  relationResult('Id_1', 'Id_2', 'right', ['Green label']),
];
