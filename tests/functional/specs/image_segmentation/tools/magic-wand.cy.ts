import { ImageView, LabelStudio, Sidebar } from '@heartexlabs/ls-test/helpers/LSF';
import { magicWandConfig, magicWandImageData } from '../../../data/image_segmentation/tools/magic-wand';
import { FF_DEV_4081, FF_LSDV_4583 } from '../../../../../src/utils/feature-flags';
import { Generator } from '@heartexlabs/ls-test/helpers/common/Generator';

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

  it.only('Should be able to serialize and deserialize the same region', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_LSDV_4583]: true,
    });
    Generator.generateImageUrl({ width: 10, height: 10 })
      .then((imageUrl) => {
        LabelStudio.params()
          .config(magicWandConfig)
          .data({ image: imageUrl })
          .withResult([])
          .init();

        ImageView.waitForImage();

        ImageView.clickAtRelative(.15, .15);
        ImageView.waitForPixelRelative(.15, .15, '#a1a1a1', { timeout: 10000 });

        Sidebar.hasRegions(1);
        ImageView.capture('RegionOnCanvas');

        LabelStudio.serialize().then((data) => {
          LabelStudio.params()
            .config(magicWandConfig)
            .data({ image: imageUrl })
            .withResult(data)
            .init();

          ImageView.waitForImage();

          Sidebar.hasRegions(1);
          ImageView.waitForPixelRelative(.15, .15, '#a1a1a1', { timeout: 10000 });
          ImageView.canvasShouldNotChange('RegionOnCanvas');
        });
      });

  });
});
