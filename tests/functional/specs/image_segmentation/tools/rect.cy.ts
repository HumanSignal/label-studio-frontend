import { ImageView, Labels, LabelStudio, Sidebar } from '@heartexlabs/ls-test/helpers/LSF';
import {
  rectangleToolAndLabelsConfig,
  simpleImageData,
  simpleRectangleResult
} from 'data/image_segmentation/tools/rect';
import { FF_DEV_1442 } from '../../../../../src/utils/feature-flags';

describe('Rectangle tool', () => {
  it('should not draw rectangle when clicking outside to unselect (FF_DEV_1442 = true)', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_DEV_1442]: true,
    });

    LabelStudio.params()
      .config(rectangleToolAndLabelsConfig)
      .data(simpleImageData)
      .withResult(simpleRectangleResult)
      .init();

    LabelStudio.waitForObjectsReady();

    Sidebar.hasRegions(1);
    Sidebar.toggleRegionSelection(0);
    Labels.select('Label 1');

    ImageView.clickAtRelative(0.5, 0.5);
    ImageView.clickAtRelative(0.7, 0.7);
    Sidebar.hasRegions(1);
    Labels.selectedLabel.should('have.length', 0);
  });

  it('should draw rectangle by dragging (FF_DEV_1442 = true)', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_DEV_1442]: true,
    });

    LabelStudio.params()
      .config(rectangleToolAndLabelsConfig)
      .data(simpleImageData)
      .withResult(simpleRectangleResult)
      .init();

    LabelStudio.waitForObjectsReady();

    Sidebar.hasRegions(1);
    Sidebar.toggleRegionSelection(0);
    Labels.select('Label 1');

    ImageView.drawRectRelative(0.5, 0.5, 0.2, 0.2);
    Sidebar.hasRegions(2);
    Labels.selectedLabel.should('contain.text', 'Label 1');
  });

  it('should draw rectangle when clicking outside (FF_DEV_1442 = false)', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_DEV_1442]: false,
    });

    LabelStudio.params()
      .config(rectangleToolAndLabelsConfig)
      .data(simpleImageData)
      .withResult(simpleRectangleResult)
      .init();

    LabelStudio.waitForObjectsReady();

    Sidebar.hasRegions(1);
    Sidebar.toggleRegionSelection(0);
    Labels.select('Label 1');

    ImageView.clickAtRelative(0.5, 0.5);
    ImageView.clickAtRelative(0.7, 0.7);
    Sidebar.hasRegions(2);
    Labels.selectedLabel.should('contain.text', 'Label 1');
  });

  it('should draw rectangle by dragging (FF_DEV_1442 = false)', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_DEV_1442]: false,
    });

    LabelStudio.params()
      .config(rectangleToolAndLabelsConfig)
      .data(simpleImageData)
      .withResult(simpleRectangleResult)
      .init();

    LabelStudio.waitForObjectsReady();

    Sidebar.hasRegions(1);
    Sidebar.toggleRegionSelection(0);
    Labels.select('Label 1');

    ImageView.drawRectRelative(0.5, 0.5, 0.2, 0.2);
    Sidebar.hasRegions(2);
    Labels.selectedLabel.should('contain.text', 'Label 1');
  });
});
