import { ImageView, Labels, LabelStudio, Sidebar } from '@heartexlabs/ls-test/helpers/LSF';
import { brushCenteredConfig, brushConfig, brushImageData } from '../../../data/image_segmentation/tools/brush';
import { Generator } from '@heartexlabs/ls-test/helpers/common/Generator';

describe('Brush tool', () => {
  it('Should be able to draw over the same brush region', () => {
    LabelStudio.params()
      .config(brushConfig)
      .data(brushImageData)
      .withResult([])
      .init();

    ImageView.waitForImage();

    cy.log('Draw the region');
    Labels.select('Label B');
    ImageView.drawPolylineRelative([[0.1, 0.1], [0.9, 0.1], [0.1, 0.12], [0.9, 0.12], [0.1, 0.14], [0.9, 0.14]]);

    cy.log('Continue drawing over the first region');
    ImageView.drawPolylineRelative([[0.1, 0.11], [0.9, 0.11], [0.1, 0.13], [0.9, 0.13]]);

    cy.log('The region, the label and the tool sholdn\'t be unselected during the drawing');
    cy.log('Repeat once again');
    ImageView.drawPolylineRelative([[0.3, 0.12], [0.7, 0.12]]);

    cy.log('As well as we drawing the same region, there should be only one region at the sidebar');
    Sidebar.hasRegions(1);
  });

  it('Should be able to erase continuously', () => {
    LabelStudio.params()
      .config(brushConfig)
      .data(brushImageData)
      .withResult([])
      .init();

    ImageView.waitForImage();

    cy.log('Draw the region');
    Labels.select('Label B');
    ImageView.drawPolylineRelative([[0.1, 0.1], [0.9, 0.1], [0.1, 0.12], [0.9, 0.12], [0.1, 0.14], [0.9, 0.14]]);

    ImageView.selectEraserToolByButton();
    ImageView.drawPolylineRelative([[0.3, 0.12], [0.7, 0.12]]);

    Sidebar.hasSelectedRegion(0);
  });

  it('Should draw only within the boundaries of the canvas', () => {
    Generator.generateImageUrl({ width: 50, height: 100 })
      .then((imageData) => {
        LabelStudio.params()
          .config(brushConfig)
          .data({ image: imageData })
          .withResult([])
          .init();

        ImageView.waitForImage();

        Labels.select('Label A');
        ImageView.drawPolylineRelative([[0.1, 0.3], [2, 0.1]], {
          beforeMouseup() {
            ImageView.pixelRelativeShouldBe(0.1, 0.3, '#64b164');
            ImageView.pixelRelativeShouldBe(2, 0.1, '#fafafa');
          },
        });

        ImageView.pixelRelativeShouldBe(0.1, 0.3, '#64b164');
        ImageView.pixelRelativeShouldBe(2, 0.1, '#fafafa');
      });
  });

  it('Should draw only within the boundaries of the canvas even with centered image', () => {
    Generator.generateImageUrl({ width: 50, height: 100 })
      .then((imageData) => {
        LabelStudio.params()
          .config(brushCenteredConfig)
          .data({ image: imageData })
          .withResult([])
          .init();

        ImageView.waitForImage();

        Labels.select('Label A');
        ImageView.drawPolylineRelative([[0.5, 0.3], [2, 0.1]], {
          beforeMouseup() {
            ImageView.pixelRelativeShouldBe(0.5, 0.3, '#fafafa');
            ImageView.pixelRelativeShouldBe(1, 0.234, '#64b164');
            ImageView.pixelRelativeShouldBe(2, 0.1, '#fafafa');
          },
        });

        ImageView.pixelRelativeShouldBe(0.5, 0.3, '#fafafa');
        ImageView.pixelRelativeShouldBe(1, 0.234, '#64b164');
        ImageView.pixelRelativeShouldBe(2, 0.1, '#fafafa');
      });
  });
});
