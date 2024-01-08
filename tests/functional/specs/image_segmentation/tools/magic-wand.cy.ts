import { ImageView, LabelStudio, Sidebar } from '@heartexlabs/ls-test/helpers/LSF';
import { magicWandConfig, magicWandImageData } from '../../../data/image_segmentation/tools/magic-wand';
import { FF_DEV_4081 } from '../../../../../src/utils/feature-flags';

describe('Magic Wand tool', () => {
  beforeEach(() => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_DEV_4081]: true,
    });
  });

  it('Should be able to extend the same region', () => {
    LabelStudio.params()
      .config(magicWandConfig)
      .data(magicWandImageData)
      .withResult([])
      .init();

    ImageView.waitForImage();

    ImageView.clickAtRelative(.1, .1);
    ImageView.clickAtRelative(.9, .9);
    ImageView.clickAtRelative(.5, .5);

    Sidebar.hasRegions(1);
  });

  it('Should not switch to another layer while clicking the same region', () => {
    LabelStudio.params()
      .config(magicWandConfig)
      .data(magicWandImageData)
      .withResult([])
      .init();

    ImageView.waitForImage();

    ImageView.clickAtRelative(.5, .5);
    ImageView.clickAtRelative(.5, .5);
    ImageView.clickAtRelative(.5, .5);

    Sidebar.hasRegions(1);
  });
});
