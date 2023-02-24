
/* global Feature, Scenario */

const { serialize } = require('./helpers');
const { fail } = require('assert');

Feature('Text Area');

const config = `
<View> 
  <Text name="text" size="10" value="$text"/> 
  <TextArea name="ta" toName="text"></TextArea> 
</View>
`;

const data = {
  text: 'To have faith is to trust yourself to the water',
};

const params = { annotations: [{ id: 'test', result: [] }], config, data };

Scenario('Check if text area is saving lead_time', async function({ I, LabelStudio, AtTextAreaView }) {
  I.amOnPage('/');

  LabelStudio.init(params);

  AtTextAreaView.addNewTextTag('abcabc');

  AtTextAreaView.addNewTextTag('abc abc abc abc');

  AtTextAreaView.addNewTextTag('cba cba cba');

  const result = await I.executeScript(serialize);

  if (!result[0]?.meta?.lead_time || result[0].meta?.lead_time < 1)
    fail('Lead time is not saved');
});
