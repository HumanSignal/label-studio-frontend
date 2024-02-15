export const simpleData = {
  text: 'The Answer to the Ultimate Question of Life, the Universe, and Everything',
};

export const simpleMIGData = {
  images: [
    'https://data.heartex.net/open-images/train_0/mini/0030019819f25b28.jpg',
    'https://data.heartex.net/open-images/train_0/mini/00155094b7acc33b.jpg',
    'https://data.heartex.net/open-images/train_0/mini/00133643bbf063a9.jpg',
    'https://data.heartex.net/open-images/train_0/mini/0061ec6e9576b520.jpg',
  ],
};

export const numberConfigMinMax = `<View>
  <Text name="text" value="$text"/>
  <Number name="answer" toName="text" min="2" max="128" step="2" />
</View>`;

export const numberPerRegionConfig = `<View>
  <Text name="text" value="$text"/>
  <Labels name="label" toName="text">
    <Label value="Word" background="orange" />
  </Labels>
  <Number name="answer" toName="text" min="2" max="128" step="2" perRegion="true" />
</View>`;

export const numberPerItemConfig = `<View>
  <Image name="image" valueList="$images"/>
  <Number name="answer" toName="image" min="2" max="128" step="2" perItem="true" />
</View>`;

export const numberResult = [
  {
    id: 'n2ldmNpSQI',
    from_name: 'answer',
    to_name: 'text',
    type: 'number',
    value: {
      number: 42,
    },
  },
];

export const numberPerRegionResult = [
  {
    'value': {
      'start': 4,
      'end': 10,
      'text': 'Answer',
      'labels': [
        'Word',
      ],
    },
    'id': 'oAfls5zbRH',
    'from_name': 'label',
    'to_name': 'text',
    'type': 'labels',
    'origin': 'manual',
  },
  {
    'value': {
      'start': 63,
      'end': 73,
      'text': 'Everything',
      'labels': [
        'Word',
      ],
    },
    'id': '6ogw2y5n_S',
    'from_name': 'label',
    'to_name': 'text',
    'type': 'labels',
    'origin': 'manual',
  },
];
