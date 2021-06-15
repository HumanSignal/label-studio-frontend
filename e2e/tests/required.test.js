/* global Feature, Scenario, locate */

const { initLabelStudio } = require("./helpers");

Feature("Test required param");

const config = `
  <View>
    <Text name="text" value="$text"></Text>
    <Choices name="validation-label" required="true" toName="text">
      <Choice value="Missing words" alias="missing-words"></Choice>
      <Choice value="Valid" alias="valid"></Choice>
    </Choices>
    <Choices name="second" required="true" toName="text">
      <Choice value="Don't select me" alias="dont"></Choice>
      <Choice value="Me neither" alias="neither"></Choice>
    </Choices>
    <Choices name="easter-egg" required="true" toName="text"
      visibleWhen="choice-selected"
      whenTagName="second"
      whenChoiceValue="Me neither"
    >
      <Choice value="Secret level"></Choice>
      <Choice value="Click on me now"></Choice>
    </Choices>
  </View>
`;

const complex = `
  <View>
    <Text name="text" value="$text"></Text>
    <Labels name="toggle">
      <Label value="Hidden" />
      <Label value="Useless" />
    </Labels>
    <View>(select region to see more required controls)</View>
    <View visibleWhen="region-selected">
      <Header>Required per-region choices</Header>
      <Choices name="validation-label" required="true" toName="text" perRegion="true">
        <Choice value="Missing words" alias="missing-words"></Choice>
        <Choice value="Valid" alias="valid"></Choice>
      </Choices>
    </View>

    <Header>Required common description</Header>
    <Textarea name="common-description" toName="text" required="true" />
    <View visibleWhen="region-selected">
      <Header>Required region description</Header>
      <Textarea name="region-description" toName="text" required="true" perRegion="true" />
    </View>

    <Header>Nested controls are required, but only when you select one of those:</Header>
    <Choices name="switch" toName="text">
      <Choice value="Required textarea" alias="dont"></Choice>
      <Choice value="Required choices" alias="neither"></Choice>
    </Choices>
    <View visibleWhen="choice-selected"
      whenTagName="switch"
      whenChoiceValue="Required textarea">
      <Header>Required only when "Required textarea" selected</Header>
      <Textarea name="choice-description" toName="text" required="true" />
    </View>

    <View visibleWhen="choice-selected"
      whenTagName="switch"
      whenChoiceValue="Required choices">
      <Header>Required only when "Required choices" selected</Header>
      <Choices name="choice" toName="text" required="true">
        <Choice value="Don't select me" alias="dont"></Choice>
        <Choice value="Me neither" alias="neither"></Choice>
      </Choices>
    </View>
  </View>
`;

const text = "To have faith is to trust yourself to the water";
const result = {
  id: "qwerty",
  from_name: "toggle",
  to_name: "text",
  type: "labels",
  value: { start: 3, end: 7, labels: ["Hidden"] },
};
const annotations = [{ id: "1", result: [result] }];

Scenario("Check required param", async function({I}) {
  const params = { config, data: { text } };

  const waitForError = name => {
    I.waitForText("OK");
    I.see("Warning");
    I.see('Checkbox "' + name + '" is required');
    I.seeElement(".ant-modal");
    I.click("OK");
    I.waitToHide(".ant-modal");
  };

  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, params);

  // Add new Annotation to be able to submit it
  I.click(".lsf-annotation-tabs__add");
  I.click("Submit");
  waitForError("validation-label");

  I.click("Me neither");
  I.click("Submit");
  waitForError("validation-label");

  I.click("Valid");
  I.click("Submit");
  waitForError("easter-egg");

  I.click("Don't select me");
  I.click("Submit");
  // Annotation is submitted, so now we can only update it
  I.dontSee("Submit");
  I.see("Update");

  // Reload to check another combination
  I.executeAsyncScript(initLabelStudio, params);
  // Page is reloaded, there are no new annotation from prev steps
  I.dontSee("New annotation");
  I.click(".lsf-annotation-tabs__add");
  I.click("Valid");
  I.click("Submit");
  I.see("Warning");
  I.see('Checkbox "second" is required');
});

Scenario("Check required param in complex config", async function({I}) {
  const params = { annotations, config: complex, data: { text } };

  const waitForError = name => {
    I.waitForText("OK");
    I.see("Warning");
    // Two possible errors:
    // - Checkbox "name" is required.
    // - Input for the textarea "name" is required.
    I.see('"' + name + '" is required');
    I.seeElement(".ant-modal");
    I.click("OK");
    I.waitToHide(".ant-modal");
  };

  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, params);

  // we already have an annotation
  I.click("Update");
  waitForError("validation-label");

  // region stays selected after error, so per-region controls are visible
  I.click("Valid");
  I.click("Update");
  waitForError("common-description");

  I.fillField("common-description", "some text");
  I.click("Update");
  waitForError("region-description");

  // again stays visible
  I.fillField("region-description", "some description");

  I.click("Update");
  // after successful update region is unselected and no modals shown
  I.dontSee("Valid");
  I.dontSeeElement(".ant-modal");

  I.click("Required textarea");
  I.click("Update");
  waitForError("choice-description");

  I.click("Required choices");
  I.click("Update");
  waitForError("choice");

  I.click("Me neither");
  // select labeled region
  I.click(locate("li").withText("have"));
  I.see("Valid");
  I.click("Update");
  I.dontSee("Valid");

  I.click("Required textarea");
  I.click("Update");
  waitForError("choice-description");
  I.fillField("choice-description", "test text");
  // select labeled region
  I.click(locate("li").withText("have"));
  I.see("Valid");
  I.click("Update");
  I.dontSee("Valid");

  I.click(".lsf-annotation-tabs__add");
  I.click("Submit");
  waitForError("common-description");
  I.fillField("common-description", "some text");
  I.click("Submit");
  I.dontSee("Submit");
  I.see("Update");
});
