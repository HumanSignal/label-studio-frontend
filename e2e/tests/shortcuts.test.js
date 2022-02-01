/* global Feature, DataTable, Data, locate, Scenario, locate */

const assert = require("assert");

Feature("Shortcuts functional");

const createConfig = ({ rows = "1" }) => {
  return `<View>
  <TextArea name="text" toName="audio" editable="true" rows="${rows}">
    <Shortcut alias="[-]" value="-" hotkey="1" />
    <Shortcut alias="[+]" value="+" hotkey="2" />
    <Shortcut alias="[!]" value="!" hotkey="3" />
    <Shortcut alias="[EMOJI]" value="🙃" hotkey="4" />
  </TextArea>
  <AudioPlus name="audio" value="$audio"/>
  <Labels name="labels" toName="audio" allowempty="true">
    <Label value="Label1"/>
    <Label value="Label2"/>
  </Labels>
</View>
`;
};

const configParams = new DataTable(["inline"]);

[true, false].forEach((inline) => {
  configParams.add([inline]);
});

const AUDIO_URL = "https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/audio/barradeen-emotional.mp3";

const TEXT_SELECTOR = "[name='text']";

Data(configParams).Scenario("Should keep the focus and cursor position.", async ({ I, LabelStudio, AtSidebar, current }) => {
  const { inline } = current;
  const config = createConfig({
    rows: inline ? "1" : "3",
  });

  const params = {
    config,
    data: { audio: AUDIO_URL },
  };

  I.amOnPage("/");
  LabelStudio.init(params);
  AtSidebar.seeRegions(0);

  // Check if there is right input element
  I.seeElement((inline ? "input" : "textarea") + TEXT_SELECTOR);

  // Input something there
  I.fillField(TEXT_SELECTOR, "A B");

  // Try to use shortcuts
  // A B
  I.click(TEXT_SELECTOR);
  // A B|
  // Shortcut by pressing hotkey (the cursor is at the end)
  I.pressKey("3");
  // A B!|
  I.pressKey("ArrowLeft");
  // A B|!
  I.pressKey("ArrowLeft");
  // A |B!
  // Shortcut by clicking button (the cursor is in the middle)
  I.click(locate(".ant-tag").toXPath() + "[contains(text(), '[+]')]");
  // A +|B!
  I.pressKey("Space");
  // A + |B!
  I.pressKey("ArrowLeft");
  // A +| B!
  I.pressKey("ArrowLeft");
  // A |+ B!
  I.pressKey("ArrowLeft");
  // A| + B!
  I.pressKey("ArrowLeft");
  // |A + B!
  // Shortcut by pressing hotkey (the cursor is at the begin)
  I.pressKey("1");
  // -|A + B!
  // Commit
  I.pressKey(["Shift", "Enter"]);

  // If we got an expected result then we didn't lost focus.
  AtSidebar.seeRegions(1);
  AtSidebar.see("-A + B!");
});

