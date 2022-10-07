/* global Feature, Scenario, locate */

const { serialize, selectText } = require("./helpers");

const assert = require("assert");

Feature("Taxonomy");

const config = `<View>
  <Text name="text" value="$text"/>
  <Labels name="label" toName="text">
    <Label value="PER" background="red"/>
    <Label value="ORG" background="darkorange"/>
    <Label value="LOC" background="orange"/>
    <Label value="MISC" background="green"/>
  </Labels>
  <Taxonomy name="taxonomy" toName="text" perRegion="true" >
    <Choice value="Archaea" />
    <Choice value="Bacteria" />
    <Choice value="Eukarya">
      <Choice value="Human" />
      <Choice value="Oppossum" />
      <Choice value="Extraterrestial" selected="true" />
    </Choice>
  </Taxonomy>
</View>
`;



const data = {
  text: `To have faith is to trust yourself to the water`,
};

const annotations = [
  { label: 'PER', rangeStart: 0, rangeEnd: 2, text: 'To' },
];

const params = { config, data };

Scenario("Check Taxonomy holds state between annotations and saves result", async function({ I, LabelStudio }) {

  I.amOnPage("/");

  LabelStudio.init(params);

  annotations.forEach(annotation => {
    I.click(locate("span").withText(annotation.label));
    I.executeScript(selectText, {
      selector: ".lsf-htx-richtext",
      rangeStart: annotation.rangeStart,
      rangeEnd: annotation.rangeEnd,
    });
    I.click(locate("span").withText(annotation.label));
    I.click(locate("li").withText(annotation.text));
  });

  annotations.forEach(annotation => {
    I.click(locate("li").withText(annotation.text));

  });
  const results = await I.executeScript(serialize);

  results.filter(result => result.value.labels).forEach((result, index) => {
    const input = annotations[index];
    const expected = { end: input.rangeEnd, labels: [input.label], start: input.rangeStart, text: input.text };
    
    assert.deepEqual(result.value, expected);
  });

});
