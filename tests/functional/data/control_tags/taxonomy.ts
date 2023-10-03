export const simpleData = {
  text: 'This text exists for no reason',
};

export const dataWithPrediction =
  {
    'data': {
      'text': 'Calif. wildfires signal the arrival of a planetary fire age https://t.co/Vvo9noqQfA',
    },
    'annotations': [
      {
        'result': [
          {
            'id': 'n2ldmNpSQI',
            'type': 'taxonomy',
            'value': {
              'taxonomy': [
                [
                  'Archaea',
                ],
                [
                  'Bacteria',
                ],
              ],
            },
            'origin': 'manual',
            'to_name': 'text',
            'from_name': 'taxonomy',
          },
        ],
        'ground_truth': false,
        'model_version': 'model 0',
        'score': 0.425405738240795,
      },
    ],
    'predictions': [
      {
        'result': [
          {
            'id': 'n2ldmNpSQI',
            'type': 'taxonomy',
            'value': {
              'taxonomy': [
                [
                  'Archaea',
                ],
                [
                  'Bacteria',
                ],
              ],
            },
            'origin': 'manual',
            'to_name': 'text',
            'from_name': 'taxonomy',
          },
        ],
        'ground_truth': false,
        'model_version': 'model 0',
        'score': 0.425405738240795,
      },
    ],
  };

export const taxonomyConfig = `<View>
  <Text name="text" value="$text"/>
  <Taxonomy name="choices" toName="text">
    <Choice value="Choice 1" alias="C1" />
    <Choice value="Choice 2" alias="C2" hint="A hint for Choice 2" />
    <Choice value="Choice 3" selected="true" />
  </Taxonomy>
</View>`;
export const taxonomyConfigWithMaxUsages = `<View>
  <View>
  <Text name="text" value="$text"/>
  <Taxonomy name="taxonomy" toName="text" maxUsages="1">
    <Choice value="Archaea" />
    <Choice value="Bacteria" />
    <Choice value="Eukarya" />
  </Taxonomy>
</View>
</View>`;

export const dynamicData = {
  text: 'This text exists for no reason',
  items: [
    { value: 'Choice 1' },
    { value: 'Choice 2', hint: 'A hint for Choice 2' },
    { value: 'Choice 3', selected: true },
  ],
};

export const dynamicTaxonomyConfig = `<View>
  <Text name="text"/>
  <Taxonomy name="choices" toName="text" value="$items">
  </Taxonomy>
</View>`;

export const taxonomyResultWithAlias = {
  'id': 'aliased',
  'type': 'taxonomy',
  'value': {
    'taxonomy': [['C2']],
  },
  'origin': 'manual',
  'to_name': 'text',
  'from_name': 'choices',
};
