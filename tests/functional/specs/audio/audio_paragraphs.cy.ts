import { LabelStudio, Sidebar, AudioView } from '@heartexlabs/ls-test/helpers/LSF/index';
import * as audioFixtures from 'data/audio/audio_paragraphs';
import { FF_LSDV_E_278 } from '../../../../src/utils/feature-flags';

describe('Audio: Paragraphs Sync', () => {

  beforeEach(() => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_LSDV_E_278]: true,
    });
  });

  it('Correctly loads with Paragraph segments as Audio segments', () => {
    LabelStudio.params()
      .config(audioFixtures.config)
      .data(audioFixtures.data)
      .withResult(audioFixtures.result) 
      .init();

    LabelStudio.waitForObjectsReady();

    Sidebar.hasRegions(4);

    AudioView.isReady();
    AudioView.toMatchImageSnapshot();
  });

  // it('Should have changes in canvas', () => {
  //   LabelStudio.params()
  //     .config(simpleVideoConfig)
  //     .data(simpleVideoData)
  //     .withResult()
  //     .init();
  //   LabelStudio.waitForObjectsReady();
  //   Sidebar.hasNoRegions();
  //   VideoView.captureCanvas('canvas');

  //   Labels.select('Label 2');
  //   VideoView.drawRectRelative(.2, .2, .6, .6);
  //   Sidebar.hasRegions(1);
  //   VideoView.canvasShouldChange('canvas', 0);
  // });

  // describe('Rectangle', () => {
  //   it('Should be invisible out of the lifespan', () =>{
  //     LabelStudio.params()
  //       .config(simpleVideoConfig)
  //       .data(simpleVideoData)
  //       .withResult(simpleVideoResult)
  //       .init();
  //     LabelStudio.waitForObjectsReady();
  //     Sidebar.hasRegions(1);
  //     VideoView.captureCanvas('canvas');

  //     VideoView.clickAtFrame(4);
  //     VideoView.canvasShouldChange('canvas', 0);
  //   });
  // });

  // describe('Transformer', () => {
  //   it.only('Should be invisible out of the lifespan', () =>{
  //     LabelStudio.params()
  //       .config(simpleVideoConfig)
  //       .data(simpleVideoData)
  //       .withResult(simpleVideoResult)
  //       .init();
  //     LabelStudio.waitForObjectsReady();
  //     Sidebar.hasRegions(1);

  //     cy.log('Remember an empty canvas state');
  //     VideoView.clickAtFrame(4);
  //     VideoView.captureCanvas('canvas');

  //     VideoView.clickAtFrame(3);
  //     cy.log('Select region');
  //     VideoView.clickAtRelative(.5,.5);
  //     Sidebar.hasSelectedRegions(1);
  //     VideoView.clickAtFrame(4);
  //     Sidebar.hasSelectedRegions(1);
  //     VideoView.canvasShouldNotChange('canvas', 0);
  //   });
  // });
});

