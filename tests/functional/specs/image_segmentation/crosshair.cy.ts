import { Generator } from '@heartexlabs/ls-test/helpers/common/Generator';
import { ImageView, LabelStudio } from '@heartexlabs/ls-test/helpers/LSF';
import { crosshairConfig } from '../../data/image_segmentation/crosshair';
import { FF_DEV_1285 } from '../../../../src/utils/feature-flags';

describe('Image Segmentation - Crosshair', () => {
  it('should display crosshair under the cursor', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_DEV_1285]: true,
    });

    Generator.generateImageUrl({ width: 700, height: 1000 })
      .then((imageData) => {
        LabelStudio.params()
          .config(crosshairConfig)
          .data({ image: imageData })
          .withResult([])
          .init();
      });

    LabelStudio.waitForObjectsReady();

    ImageView.moveMouseToRelative(0.2, 0.23);
    ImageView.capture('crosshair');

    ImageView.moveMouseToRelative(0.8, 0.77);
    ImageView.canvasShouldChange('crosshair',0);
  });
});
