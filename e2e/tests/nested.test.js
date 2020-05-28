/* global Feature, Scenario, locate */

const { initLabelStudio, serialize } = require("./helpers");

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
    <Textarea name="sentiment2" toName="my_text" perRegion="true"
              choice="single" showInLine="true" whenLabelValue="Person">
    </Textarea>
    <Choices name="sentiment" toName="my_text" perRegion="true"
             choice="single" showInLine="true" whenLabelValue="Person">
      <Choice value="Female"/>
      <Choice value="Male"/>
    </Choices>
    <Choices name="sentiment2" toName="my_text" perRegion="true"
             choice="single" showInLine="true" whenLabelValue="Money">
      <Choice value="USD"/>
      <Choice value="EUR"/>
    </Choices>
    <Choices name="sentiment3" toName="my_text" 
             choice="single" showInLine="true" perRegion="true">
      <Choice value="Positive"/>
      <Choice value="Negative"/>
    </Choices>
  </View>`;

const reviewText =
  "Not much to write about here, but it does exactly what it's supposed to. filters out the pop sounds. now my recordings are much more crisp. it is one of the lowest prices pop filters on amazon so might as well buy it, they honestly work the same despite their pricing,";

Scenario("Check simple nested Choices for Text", async function(I) {
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

Scenario("check good nested Choice for Text", async function(I) {
  const params = {
    config: configComplicated,
    data: { reviewText },
  };

  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, params);

  const personTag = locate(".ant-tag").withText("Person");
  I.seeElement(personTag);
  I.click(personTag);
  I.doubleClick(".htx-text");
  I.see("Regions (1)");
  I.dontSee("Female");

  // header without selected region
  const regionsHeader = locate("div").withText("Regions (1)");
  // the only element of regions list after this header
  const regionInList = locate(".ant-list")
    .after(regionsHeader)
    .find("li");
  // select it
  I.click(regionInList);

  I.see("Regions (1)");

  I.click("Female");

  const result = await I.executeScript(serialize);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0].value.labels, ["Person"]);
  assert.deepEqual(result[1].value.choices, ["Female"]);
});
