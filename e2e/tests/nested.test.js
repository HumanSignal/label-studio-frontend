/* global Feature, Scenario, locate */

const { initLabelStudio, serialize, selectText } = require("./helpers");

const assert = require("assert");

Feature("Nested Choices");

const configSimple = `
  <View>
    <Text name="text" value="$reviewText" valueType="text" />
    <Choices name="sentiment" toName="text" showInLine="true">
      <Choice value="Positive" />
      <Choice value="Negative" />
      <Choice value="Neutral" />
    </Choices>
    <Choices
      name="ch"
      toName="text"
      choice="single"
      showInLine="true"
      visibleWhen="choice-selected"
    >
      <Choice value="Descriptive" />
      <Choice value="Emotional" />
    </Choices>
  </View>`;

const configComplicated = `
  <View>
    <Labels name="ner" toName="my_text" choice="multiple">
      <Label value="Person" background="red"/>
      <Label value="Organization" background="darkorange"/>
      <Label value="Fact" background="orange"/>
      <Label value="Money" background="green"/>
      <Label value="Date" background="darkblue"/>
      <Label value="Time" background="blue"/>
      <Label value="Ordinal" background="purple"/>
      <Label value="Percent" background="#842"/>
      <Label value="Product" background="#428"/>
      <Label value="Language" background="#482"/>
      <Label value="Location" background="rgba(0,0,0,0.8)"/>
    </Labels>
    <Text name="my_text" value="$reviewText"/>
    <Choices name="sentiment" toName="my_text" choice="single" showInLine="true">
      <Choice value="Positive"/>
      <Choice value="Negative"/>
      <Choice value="Neutral"/>
    </Choices>
    <Choices name="positive" toName="my_text"
             visibleWhen="choice-selected"
             whenTagName="sentiment"
             whenChoiceValue="Positive">
      <Choice value="Smile" />
      <Choice value="Laughter" />
    </Choices>
    <View visibleWhen="region-selected" whenLabelValue="Person">
      <Header>More details about this person:</Header>
      <Textarea name="description" toName="my_text" perRegion="true"
                choice="single" showInLine="true" whenLabelValue="Person">
      </Textarea>
      <Choices name="gender" toName="my_text" perRegion="true"
               choice="single" showInLine="true" whenLabelValue="Person">
        <Choice value="Female"/>
        <Choice value="Male"/>
      </Choices>
    </View>
    <Choices name="currency" toName="my_text" perRegion="true"
             choice="single" showInLine="true" whenLabelValue="Money">
      <Choice value="USD"/>
      <Choice value="EUR"/>
    </Choices>
    <Choices name="sentiment2" toName="my_text"
             choice="single" showInLine="true" perRegion="true">
      <Choice value="Positive"/>
      <Choice value="Negative"/>
    </Choices>
  </View>`;

const reviewText =
  "Not much to write about here, but it does exactly what it's supposed to. filters out the pop sounds. now my recordings are much more crisp. it is one of the lowest prices pop filters on amazon so might as well buy it, they honestly work the same despite their pricing,";

Scenario("Check simple nested Choices for Text", async function ({ I }) {
  const params = {
    config: configSimple,
    data: { reviewText },
  };

  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, params);

  I.see("Positive");
  I.dontSee("Emotional");
  I.click("Positive");
  I.see("Emotional");
  I.click("Emotional");

  const result = await I.executeScript(serialize);

  assert.equal(result.length, 2);
  assert.deepEqual(result[0].value, { choices: ["Positive"] });
  assert.deepEqual(result[1].value, { choices: ["Emotional"] });
});

Scenario("check good nested Choice for Text", async function ({ I, AtLabels, AtSidebar }) {
  const params = {
    config: configComplicated,
    data: { reviewText },
  };

  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, params);

  I.click("Positive");
  I.see("Laughter");
  I.click("Laughter");

  const personTag = AtLabels.locateLabel("Person");

  I.seeElement(personTag);
  I.click(personTag);
  I.executeAsyncScript(selectText, {
    selector: ".htx-richtext",
    rangeStart: 51,
    rangeEnd: 55,
  });
  AtSidebar.seeRegions(1);
  I.dontSee("Female");

  // the only element of regions tree list
  const regionInList = locate(".lsf-entities__regions").find(".ant-list-item");
  // select this region

  I.click(regionInList);

  AtSidebar.seeRegions(1);
  I.see("More details"); // View with visibleWhen

  I.click("Female");

  const result = await I.executeScript(serialize);

  assert.equal(result.length, 4);
  assert.deepEqual(result[0].value.choices, ["Positive"]);
  assert.deepEqual(result[1].value.choices, ["Laughter"]);
  assert.deepEqual(result[2].value.labels, ["Person"]);
  assert.deepEqual(result[3].value.choices, ["Female"]);
});
