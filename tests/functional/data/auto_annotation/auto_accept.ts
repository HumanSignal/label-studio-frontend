export const imageSmartOnlyConfig = `<View>
  <Image name="img" value="$image"/>
  <Rectangle name="rectangle" toName="img" smartonly="true" />
  <Labels name="tag" toName="img">
      <Label value="Header" background="red"/>
      <Label value="Pargagraph" background="orange"/>
      <Label value="List Item" background="blue"/>
  </Labels>
  <TextArea name="ocr" toName="img" perRegion="true" editable="true" displayMode="region-list"/>
</View>`;

export const imageData = { image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Html_headers.png/640px-Html_headers.png' };

export const getImageSuggestions = (area) => {
  area.store?.loadSuggestions?.(new Promise((resolve) => resolve([
    {
      'original_width': 640,
      'original_height': 507,
      'image_rotation': 0,
      'value': { 'x': 0.78125, 'y': 10.650887573964498, 'width': 98.28125, 'height': 10.453648915187378, 'rotation': 0 },
      'id': '61LzdjSgA7',
      'from_name': 'rectangle',
      'to_name': 'img',
      'type': 'rectangle',
      'origin': 'prediction',
    },
  ])), x => x);
};

export const imageOcrSmartOnlyConfig = `<View>
  <Image name="img" value="$image"/>
  <Rectangle name="rectangle" toName="img" smartonly="true" />
  <TextArea name="ocr" toName="img" perRegion="true" editable="true" />
</View>`;

export const getImageOcrSuggestions = (area) => {
  let result;

  if (area.results.toJSON().find(r => r.type === 'textarea')?.value.text[0] === 'Header 2') {
    result = [
      {
        'original_width': 640,
        'original_height': 507,
        'image_rotation': 0,
        'value': {
          'x': 1.0283279797125784,
          'y': 24.092420400112506,
          'width': 25.593940828402324,
          'height': 5.337841645534,
          'rotation': 0,
        },
        // It's bad that result.id = area.id but it is the only way to process id for regions for now
        'id': area.id,
        'from_name': 'rectangle',
        'to_name': 'img',
        'type': 'rectangle',
      },
      {
        'original_width': 640,
        'original_height': 507,
        'image_rotation': 0,
        'value': {
          'x': 1.0283279797125784,
          'y': 24.092420400112506,
          'width': 25.593940828402324,
          'height': 5.337841645534,
          'rotation': 0,
          'text': [
            'Header 2',
          ],
        },
        'id': area.id,
        'from_name': 'ocr',
        'to_name': 'img',
        'type': 'textarea',
      },
    ];
  } else {
    result = [
      {
        'original_width': 640,
        'original_height': 507,
        'image_rotation': 0,
        'value': {
          'x': 12.568453085376174,
          'y': 52.080022541561,
          'width': 9.026434488588334,
          'height': 3.3181177796562404,
          'rotation': 0,
        },
        // It's bad Tat result.id = area.id but it is the only way to process id for regions for now
        'id': area.id,
        'from_name': 'rectangle',
        'to_name': 'img',
        'type': 'rectangle',
      },
      {
        'original_width': 640,
        'original_height': 507,
        'image_rotation': 0,
        'value': {
          'x': 12.568453085376174,
          'y': 52.080022541561,
          'width': 9.026434488588334,
          'height': 3.3181177796562404,
          'rotation': 0,
          'text': [
            'Header',
          ],
        },
        'id': area.id,
        'from_name': 'ocr',
        'to_name': 'img',
        'type': 'textarea',
      },
    ];
  }

  area.store?.loadSuggestions?.(new Promise((resolve) => resolve(result)), x => x);
};

export const llmTextareaConfig = `<View>
  <Style>
    .lsf-main-content.lsf-requesting .prompt::before { content: ' loading...'; color: #808080; }
  </Style>
  <View className="prompt">
    <TextArea name="prompt" toName="text" editable="true" rows="2" maxSubmissions="1" showSubmitButton="false" />
  </View>
  <Text name="text" value="$text"/>
  <TextArea name="answer" toName="text"/>
</View>`;
export const llmTextareaData = { text: 'Some simple text' };

export const LLM_WHAT_DO_YOU_SEE = {
  prompt: 'What do you see?',
  answer: 'I see your question!',
};

export const llmTextareaSuggestions = {
  [LLM_WHAT_DO_YOU_SEE.prompt]: [
    {
      'from_name': 'prompt',
      'id': 'ID_FROM_ML_PROMPT_1',
      'to_name': 'text',
      'type': 'textarea',
      'value': {
        'text': [
          LLM_WHAT_DO_YOU_SEE.prompt,
        ],
      },
    },
    {
      'from_name': 'answer',
      'id': 'ID_FROM_ML_ANSWER_1',
      'to_name': 'text',
      'type': 'textarea',
      'value': {
        'text': [
          LLM_WHAT_DO_YOU_SEE.answer,
        ],
      },
    },
  ],
};

export const getLlmTextareaSuggestions = (area) => {
  const prompt = area?.results?.[0]?.value?.text?.[0];

  if (prompt) {
    const suggestions = llmTextareaSuggestions[prompt];

    area.store?.loadSuggestions?.(new Promise((resolve) => resolve(suggestions)), x => x);
  }
};

export const audioConfig = `<View>
  <Audio name="audio" value="$audio"></Audio>
  <Labels name="label" toName="audio" choice="multiple" smart="true">
    <Label value="Sound" background="yellow"></Label>
  </Labels>
  <View visibleWhen="region-selected">
  <Choices name="choice" toName="audio" perRegion="true">
    <Choice value="Loud" />
    <Choice value="Quiet" />
  </Choices>
  </View>
</View>`;

export const audioData = {
  audio: 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/audio/barradeen-emotional.mp3',
};

export const getAudioSuggestions = (area) => {
  area.store?.loadSuggestions?.(new Promise((resolve) => resolve([
    {
      'original_length': 98.719925,
      'value': {
        'start': 22.243759924892704,
        'end': 27.64581590665236,
        'channel': 0,
        'labels': [
          'Sound',
        ],
      },
      'id': 'nBmoP',
      'from_name': 'label',
      'to_name': 'audio',
      'type': 'labels',
      'origin': 'manual',
    },
    {
      'original_length': 98.719925,
      'value': {
        'start': 22.243759924892704,
        'end': 27.64581590665236,
        'channel': 0,
        'choices': [
          'Loud',
        ],
      },
      'id': 'nBmoP',
      'from_name': 'choice',
      'to_name': 'audio',
      'type': 'choices',
      'origin': 'manual',
    },
  ])), x => x);
};
