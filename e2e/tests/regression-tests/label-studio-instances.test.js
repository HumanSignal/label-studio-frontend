/* global Feature, Scenario */

const assert = require("assert");

Feature("Label studio instances").tag("@regress");

const IMAGE = "https://user.fm/files/v2-901310d5cb3fa90e0616ca10590bacb3/spacexmoon-800x501.jpg";

const config = `
  <View>
    <Image name="img" value="$image" width="50%"/>
    <Rectangle name="rect" toName="img"/>
  </View>`;

Scenario("LSF instances should not cause memory leak", async ({ I, LabelStudio }) => {
  I.amOnPage("/");

  // Force clear
  I.executeAsyncScript(function(done) {
    window.LabelStudio.destroyAll();
    done();
  });

  for (let i = 10; i--;) {
    // Create LSF
    I.executeAsyncScript(function(config, image, done) {
      window.ls = new window.LabelStudio("label-studio", { config, data: { image } });
      done();
    }, config, IMAGE);
    // Try to destroy LSF
    I.executeAsyncScript(function(done) {
      window.ls.destroy();
      done();
    });
  }

  // There must be 0 instances
  const count = await I.executeAsyncScript(function(done) {
    done(window.LabelStudio.instances.size);
  });

  assert.strictEqual(count, 0);
});