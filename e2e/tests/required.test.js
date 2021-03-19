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
  </View>
`;

const text = "To have faith is to trust yourself to the water";

Scenario("Check required param", async function(I) {
  const params = { config, data: { text } };

  I.amOnPage("/");
  I.executeAsyncScript(initLabelStudio, params);

  // Add new Annotation to be able to submit it
  I.click(locate(".ant-btn").withChild("[aria-label=plus]"));
  I.click("Submit");
  I.waitForText("OK");
  I.see("Warning");
  I.see('Checkbox "validation-label" is required');
  I.seeElement(".ant-modal");
  I.click("OK");
  I.waitToHide(".ant-modal");

  I.click("Me neither");
  I.click("Submit");
  I.waitForText("OK");
  I.see("Warning");
  I.see('Checkbox "validation-label" is required');
  I.seeElement(".ant-modal");
  I.click("OK");
  I.waitToHide(".ant-modal");

  I.click("Valid");
  I.click("Submit");
  // Annotation is submitted, so now we can only update it
  I.dontSee("Submit");
  I.see("Update");

  // Reload to check another combination
  I.executeAsyncScript(initLabelStudio, params);
  // Page is reloaded, there are no new annotation from prev steps
  I.dontSee("New annotation");
  I.click(locate(".ant-btn").withChild("[aria-label=plus]"));
  I.click("Valid");
  I.click("Submit");
  I.see("Warning");
  I.see('Checkbox "second" is required');
});
