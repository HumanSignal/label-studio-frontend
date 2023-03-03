Feature('Readonly Regions');

const imageExamples = new DataTable(['example', 'regionName']);

imageExamples.add([require('../../../examples/audio-regions'), 'Beat']);

Data(imageExamples).Scenario('Audio Readonly Regions', async ({
  I,
  current,
  LabelStudio,
  AtSidebar,
  AtAudioView,
}) => {
  I.amOnPage('/');
  const { config, result: r, data } = current.example;

  // mark first result as readonly
  const result = r.map((r, i) => i === 0 ? { ...r, readonly: true } : r);

  // extracts label regions only
  const regions = result.filter(r => r.type.match('labels'));

  LabelStudio.init({
    annotations: [{
      id: 'test',
      result,
    }],
    config,
    data,
  });

  await AtAudioView.waitForAudio();

  I.say('Check region is selectable');
  AtSidebar.seeRegions(regions.length);
  AtSidebar.clickRegion(current.regionName);

  I.say('Attempt to move a readonly region');
  const readonlyRegionId = regions[0].id;

  await AtAudioView.moveRegion(readonlyRegionId, 100);

  I.say('Results are equal after modification attempt');
  await LabelStudio.resultsNotChanged(result);

  I.say('Attempt to move a non-readonly region');
  const nonReadonlyRegionId = regions[1].id;

  await AtAudioView.moveRegion(nonReadonlyRegionId, 100);

  I.say('Results are not equal after modification attempt');
  await LabelStudio.resultsChanged(result);

  I.pressKey('CommandOrControl+z');
  I.pressKey('Backspace');
  I.say('Results are equal after deletion attempt');
  await LabelStudio.resultsNotChanged(result);

  I.say('Can draw new shape');
  I.pressKey('1');

  await AtAudioView.createRegion('audio', 100, 150);
  AtSidebar.seeRegions(regions.length);
});
