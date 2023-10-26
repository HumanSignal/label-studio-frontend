import { ImageView, LabelStudio, Sidebar } from '@heartexlabs/ls-test/helpers/LSF';
import {
  simpleConfigBR,
  simpleConfigCC, simpleConfigCCWithRotationControl,
  simpleConfigCL,
  simpleConfigTC,
  simpleConfigTL,
  simpleConfigTR,
  simpleResult
} from 'data/image_segmentation/image_position';
import { Generator } from '@heartexlabs/ls-test/helpers/common/Generator';

describe('Image Segmentation - Image position', () => {
  beforeEach(() => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      fflag_fix_front_leap_32_zoom_optimization_040923_short: true,
    });
  });

  it('should display image at top left corner', () => {
    Generator
      .generateImageUrl({ width: 700, height: 1000 })
      .then((imageData) => {
        LabelStudio.params()
          .config(simpleConfigTL)
          .data({ image: imageData })
          .withResult(simpleResult)
          .init();
      });

    ImageView.waitForImage();
    ImageView.clickAtRelative(0.005,0.005);

    Sidebar.hasSelectedRegions(1);
    Sidebar.hasSelectedRegion(0);
  });

  it('should display image at top center position', () => {
    Generator
      .generateImageUrl({ width: 700, height: 1000 })
      .then((imageData) => {
        LabelStudio.params()
          .config(simpleConfigTC)
          .data({ image: imageData })
          .withResult(simpleResult)
          .init();
      });

    ImageView.waitForImage();
    ImageView.clickAtStageRelative(0.5,0.005);

    Sidebar.hasSelectedRegions(1);
    Sidebar.hasSelectedRegion(1);
  });

  it('should display image at top right corner', () => {
    Generator
      .generateImageUrl({ width: 700, height: 1000 })
      .then((imageData) => {
        LabelStudio.params()
          .config(simpleConfigTR)
          .data({ image: imageData })
          .withResult(simpleResult)
          .init();
      });

    ImageView.waitForImage();
    ImageView.clickAtStageRelative(0.995,0.005);

    Sidebar.hasSelectedRegions(1);
    Sidebar.hasSelectedRegion(2);
  });

  it('should display image at center left position', () => {
    Generator
      .generateImageUrl({ width: 700, height: 1000 })
      .then((imageData) => {
        LabelStudio.params()
          .config(simpleConfigCL)
          .data({ image: imageData })
          .withResult(simpleResult)
          .init();
      });

    ImageView.waitForImage();
    ImageView.clickAtStageRelative(0.005,0.5);

    Sidebar.hasSelectedRegions(1);
    Sidebar.hasSelectedRegion(3);
  });

  it('should display portrait-oriented image at center position', () => {
    Generator
      .generateImageUrl({ width: 400, height: 1000 })
      .then((imageData) => {
        LabelStudio.params()
          .config(simpleConfigCC)
          .data({ image: imageData })
          .withResult(simpleResult)
          .init();
      });

    ImageView.waitForImage();
    ImageView.clickAtStageRelative(0.5,0.5);

    Sidebar.hasSelectedRegions(1);
    Sidebar.hasSelectedRegion(4);
  });

  it('should display portrait-oriented image at center position', () => {
    Generator
      .generateImageUrl({ width: 1000, height: 500 })
      .then((imageData) => {
        LabelStudio.params()
          .config(simpleConfigCC)
          .data({ image: imageData })
          .withResult(simpleResult)
          .init();
      });

    ImageView.waitForImage();
    // wait for ImageView to correctly resize a stage according to the container size
    // otherwise, cypress performs the click in the wrong coordinates
    cy.wait(32);
    ImageView.clickAtStageRelative(0.5,0.5);

    Sidebar.hasSelectedRegions(1);
    Sidebar.hasSelectedRegion(4);
  });

  it('should display portrait-oriented image at bottom right position', () => {
    Generator
      .generateImageUrl({ width: 700, height: 1000 })
      .then((imageData) => {
        LabelStudio.params()
          .config(simpleConfigBR)
          .data({ image: imageData })
          .withResult(simpleResult)
          .init();
      });

    ImageView.waitForImage();
    ImageView.clickAtStageRelative(0.995,0.995);

    Sidebar.hasSelectedRegions(1);
    Sidebar.hasSelectedRegion(8);
  });

  it('should display landscape-oriented image at bottom right position', () => {
    Generator
      .generateImageUrl({ width: 1000, height: 300 })
      .then((imageData) => {
        LabelStudio.params()
          .config(simpleConfigBR)
          .data({ image: imageData })
          .withResult(simpleResult)
          .init();
      });

    ImageView.waitForImage();
    ImageView.clickAtStageRelative(0.995,0.995);

    Sidebar.hasSelectedRegions(1);
    Sidebar.hasSelectedRegion(8);
  });

  it('should keep displaying image at center even when it\'s rotated', () => {
    Generator
      .generateImageUrl({ width: 1000, height: 700 })
      .then((imageData) => {
        LabelStudio.params()
          .config(simpleConfigCCWithRotationControl)
          .data({ image: imageData })
          .withResult(simpleResult)
          .init();
      });

    ImageView.waitForImage();
    ImageView.rotateRight();

    ImageView.clickAtStageRelative(0.5,0.5);

    Sidebar.hasSelectedRegions(1);
    Sidebar.hasSelectedRegion(4);
  });

});
