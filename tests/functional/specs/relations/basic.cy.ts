import { Hotkeys, ImageView, LabelStudio, Relations, ToolBar } from '@heartexlabs/ls-test/helpers/LSF';
import {
  imageConfigWithRelations,
  simpleImageConfig,
  simpleImageData,
  simpleImageResult,
  simpleImageResultWithRelation,
  simpleImageResultWithRelations,
  simpleImageResultWithRelationsAndLabels,
  simpleImageResultWithRelationsAndLabelsAlt,
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

    Relations.hoverOverRelation(0);
    Relations.clickShowRelationLabels(0);

    Relations.hasRelationLabels([], 0);

    Relations.addLabelToRelation('Blue label', 0);

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

    Relations.hoverOverRelation(0);
    Relations.clickShowRelationLabels(0);
    Relations.hasRelationLabels(['Blue label', 'Red label'], 0);
  });

  it('should rerender relation labels input on annotation switching', () => {
    LabelStudio.params()
      .config(imageConfigWithRelations)
      .data(simpleImageData)
      .withAnnotation({
        id: 2,
        result: simpleImageResultWithRelationsAndLabelsAlt,
      })
      .withAnnotation({
        id: 1,
        result: simpleImageResultWithRelationsAndLabels,
      })
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(1);

    // open relation labels
    Relations.hoverOverRelation(0);
    Relations.clickShowRelationLabels(0);

    // open annotation list
    ToolBar.toggleAnnotationsList();
    // switch to the second annotation
    ToolBar.selectAnnotation(1);

    // open relation labels as well
    Relations.hoverOverRelation(0);
    Relations.clickShowRelationLabels(0);

    // just check the current state
    Relations.hasRelationLabels(['Green label'], 0);

    // go to the first annotation
    ToolBar.toggleAnnotationsList();
    ToolBar.selectAnnotation(0);

    // check that relations in the input are changed according to the first annotation result
    Relations.hasRelationLabels(['Blue label', 'Red label'], 0);
  });

  it('Should create correct step in history by adding relation', () => {
    LabelStudio.params()
      .config(simpleImageConfig)
      .data(simpleImageData)
      .withResult(simpleImageResult)
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(0);

    ImageView.clickAtRelative(0.3, 0.3);
    Relations.toggleCreationWithHotkey();
    ImageView.clickAtRelative(0.6, 0.6);

    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(2);
    });

    Hotkeys.undo();
    Relations.hasRelations(0);
    Hotkeys.redo();
    Relations.hasRelations(1);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(2);
    });
  });

  it('Should create correct step in history by deleting relation', () => {
    LabelStudio.params()
      .config(simpleImageConfig)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelation)
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(1);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(1);
    });

    Relations.deleteRelationAction(0);

    Relations.hasRelations(0);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(2);
    });

    Hotkeys.undo();
    Relations.hasRelations(1);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(2);
    });

    Hotkeys.redo();
    Relations.hasRelations(0);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(2);
    });
  });

  it('Should create correct step in history by changing relation direction', () => {
    LabelStudio.params()
      .config(simpleImageConfig)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelation)
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(1);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(1);
    });

    Relations.toggleRelationDirection(0);

    Relations.hasRelations(1);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(2);
    });
  });

  it('Should create correct step in history by adding label to relation', () => {
    LabelStudio.params()
      .config(imageConfigWithRelations)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelation)
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(1);
    Relations.hoverOverRelation(0);
    Relations.clickShowRelationLabels(0);
    Relations.addLabelToRelation('Blue label', 0);
    Relations.hasRelationLabels(['Blue label'], 0);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(2);
    });

    Hotkeys.undo();
    Relations.hasRelationLabels([], 0);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(2);
    });

    Hotkeys.redo();
    Relations.hasRelationLabels(['Blue label'], 0);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(2);
    });
  });

  it('Should not create step in history by highlighting relation', () => {
    LabelStudio.params()
      .config(simpleImageConfig)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelation)
      .init();

    ImageView.waitForImage();

    Relations.hoverOverRelation(0);
    Relations.stopHoveringOverRelation(0);

    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(1);
    });
  });

  it('Should not create step in history by hiding relation', () => {
    LabelStudio.params()
      .config(simpleImageConfig)
      .data(simpleImageData)
      .withResult(simpleImageResultWithRelation)
      .init();

    ImageView.waitForImage();

    Relations.hasRelations(1);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(1);
    });

    Relations.hideRelationAction(0);
    cy.window().then(win => {
      expect(win.Htx.annotationStore.selected.history.history.length).to.equal(1);
    });
  });
});
