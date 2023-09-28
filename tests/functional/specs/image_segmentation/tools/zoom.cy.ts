import { ImageView, LabelStudio } from '@heartexlabs/ls-test/helpers/LSF';
import { simpleConfig, simpleImageData } from 'data/image_segmentation/tools/zoom';

describe('Zoom tool', () => {
  it('should zoom on hotkey', () => {
    LabelStudio.params()
      .config(simpleConfig)
      .data(simpleImageData)
      .withResult([])
      .init();

    ImageView.waitForImage();

    const sizes = ImageView.image.then((img) => {
      return {
        width: parseFloat(img.css('width')),
        height: parseFloat(img.css('height')),
      };
    });

    for (let i = 0; i < 10; i++) {
      ImageView.zoomInWithHotkey();
    }

    ImageView.image.then((img) => {
      sizes.then((sizes) => {
        expect(parseFloat(img.css('width'))).to.be.greaterThan(sizes.width);
        expect(parseFloat(img.css('height'))).to.be.greaterThan(sizes.height);
      });
    });
  });
});