import { ImageView, LabelStudio, Relations } from '@heartexlabs/ls-test/helpers/LSF';
import {
  imageConfigWithRelations,
  simpleImageConfig,
  simpleImageData,
  simpleImageResultWithRelation,
  simpleImageResultWithRelations, simpleImageResultWithRelationsAndLabels
} from '../../data/relations/basic';

describe('Relations: Basic', () => {
  it('should load relations from the result', () => {
    LabelStudio.params()
      .config(simpleImageConfig)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelation)
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(1);
    Relations.hasRelation('Region', 'Region');
  });

  it('should display direction correctly', () => {
    LabelStudio.params()
      .config(simpleImageConfig)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelations)
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(3);
    Relations.hasRelationDirection('right', 0);
    Relations.hasRelationDirection('left', 1);
    Relations.hasRelationDirection('bi', 2);
  });

  it('should toggle direction', () => {
    LabelStudio.params()
      .config(simpleImageConfig)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelation)
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(1);
    Relations.hasRelationDirection('right', 0);
    Relations.toggleRelationDirection(0);
    Relations.hasRelationDirection('bi', 0);
    Relations.toggleRelationDirection(0);
    Relations.hasRelationDirection('left', 0);
    Relations.toggleRelationDirection(0);
    Relations.hasRelationDirection('right', 0);
  });

  it('should hide/show relation', () => {
    LabelStudio.params()
      .config(simpleImageConfig)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelation)
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(1);
    Relations.isNotHiddenRelation(0);
    Relations.hideRelationAction(0);
    Relations.hasRelations(1);
    Relations.isHiddenRelation(0);
    Relations.showRelationAction(0);
    Relations.hasRelations(1);
    Relations.isNotHiddenRelation(0);
  });

  it('should delete relation', () => {
    LabelStudio.params()
      .config(simpleImageConfig)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelation)
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(1);
    Relations.deleteRelationAction(0);
    Relations.hasRelations(0);
  });

  it('should set relation label', () => {
    LabelStudio.params()
      .config(imageConfigWithRelations)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelation)
      .init();

    ImageView.waitForImage();

    Relations.hoverRelation(0);
    Relations.clickShowRelationLabels(0);

    Relations.hasRelationLabels([], 0);

    Relations.addRelationLabel('Blue label', 0);

    Relations.hasRelationLabels(['Blue label'], 0);
  });

  it('should load relation with labels', () => {
    LabelStudio.params()
      .config(imageConfigWithRelations)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelationsAndLabels)
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(1);

    Relations.hoverRelation(0);
    Relations.clickShowRelationLabels(0);
    Relations.hasRelationLabels(['Blue label', 'Red label'], 0);
  });
});
