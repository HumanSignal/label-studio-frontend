import {
  AudioView,
  ImageView,
  Labels,
  LabelStudio,
  Sidebar,
  Textarea,
  useTextarea
} from '@heartexlabs/ls-test/helpers/LSF';
import {
  audioConfig, audioData, getAudioSuggestions, getImageOcrSuggestions,
  getImageSuggestions, getLlmTextareaSuggestions,
  imageData, imageOcrSmartOnlyConfig,
  imageSmartOnlyConfig,
  llmTextareaConfig, llmTextareaData
} from '../../data/auto_annotation/auto_accept';
import { FF_DEV_2715, FF_LLM_EPIC } from '../../../../src/utils/feature-flags';
import { LLM_WHAT_DO_YOU_SEE } from '../../data/lmm/accept_suggestions';

const FF_LLM_STATES = [false, true];

describe('Auto Accept - Image', () => {
  for (const ffLLMState of FF_LLM_STATES) {
    it(`should depend on auto accept toggle with FF_LLM_EPIC={${ffLLMState ? 'on' : 'off'}}`, () => {
      LabelStudio.addFeatureFlagsOnPageLoad({
        [FF_LLM_EPIC]: ffLLMState,
      });

      const listeners = {
        getImageSuggestions,
      };

      cy.spy(listeners, 'getImageSuggestions').as('getImageSuggestions');

      LabelStudio.params()
        .config(imageSmartOnlyConfig)
        .data(imageData)
        .withResult([])
        .withInterface('auto-annotation')
        .withEventListener('regionFinishedDrawing', listeners.getImageSuggestions)
        .withParam('forceAutoAnnotation', true)
        .init();

      LabelStudio.waitForObjectsReady();
      LabelStudio.hasAutoAcceptSuggestionsToggle();
      LabelStudio.hasAutoAcceptSuggestionsToggleUnchecked();

      cy.log('Get suggestions');
      ImageView.selectSmartToolByHotkey();
      ImageView.drawRectRelative(0.45, 0.45, 0.1, 0.1);

      cy.get('@getImageSuggestions').should('be.calledOnce');
      cy.log('Should see suggestions');
      cy.window(win => {
        expect(win.Htx.annotationStore.selected.suggestions.size).equal(1);
      });

      cy.log('Reject suggestion');
      ImageView.clickAtRelative(0.48, 0.23);
      LabelStudio.removeAllRegions();

      cy.log('Switch auto accept mode');
      LabelStudio.toggleAutoAcceptSuggestions();
      LabelStudio.hasAutoAcceptSuggestionsToggleChecked();

      cy.log('Get suggestions again');
      ImageView.drawRectRelative(0.45, 0.45, 0.1, 0.1);

      cy.get('@getImageSuggestions').should('be.calledTwice');
      cy.log('All suggestions should be accepted');
      cy.window((win) => {
        expect(win.Htx.annotationStore.selected.suggestions.size).equal(0);
      });
    });
  }

  it('should work with perRegion="true"', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_LLM_EPIC]: true,
    });

    const listeners = {
      getImageOcrSuggestions,
    };

    cy.spy(listeners, 'getImageOcrSuggestions').as('getImageOcrSuggestions');

    LabelStudio.params()
      .config(imageOcrSmartOnlyConfig)
      .data(imageData)
      .withResult([])
      .withInterface('auto-annotation')
      .withEventListener('regionFinishedDrawing', listeners.getImageOcrSuggestions)
      .withParam('forceAutoAnnotation', true)
      .init();

    LabelStudio.waitForObjectsReady();
    LabelStudio.hasAutoAcceptSuggestionsToggle();
    LabelStudio.hasAutoAcceptSuggestionsToggleUnchecked();

    cy.log('Get suggestions');
    ImageView.selectSmartToolByHotkey();
    ImageView.drawRectRelative(0.125, 0.52, 0.09, 0.033);

    cy.get('@getImageOcrSuggestions').should('be.calledOnce');
    cy.log('Should see suggestions');
    cy.window((win) => {
      expect(win.Htx.annotationStore.selected.suggestions.size).equal(1);
    });

    cy.log('Accept suggestion');
    ImageView.clickAtRelative(0.19, 0.59);

    cy.log('The suggestion should be accepted and replace actual region');
    Sidebar.hasRegions(1);
    cy.window((win) => {
      expect(win.Htx.annotationStore.selected.suggestions.size).equal(0);
    });
    cy.log('And it should not call ML');
    cy.get('@getImageOcrSuggestions').should('be.calledOnce');
  });

  it('should request new suggestions even on changes in perRegion results', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_LLM_EPIC]: true,
    });

    const listeners = {
      getImageOcrSuggestions,
    };

    cy.spy(listeners, 'getImageOcrSuggestions').as('getImageOcrSuggestions');

    LabelStudio.params()
      .config(imageOcrSmartOnlyConfig)
      .data(imageData)
      .withResult([])
      .withInterface('auto-annotation')
      .withEventListener('regionFinishedDrawing', listeners.getImageOcrSuggestions)
      .withParam('forceAutoAnnotation', true)
      .init();

    LabelStudio.waitForObjectsReady();
    LabelStudio.hasAutoAcceptSuggestionsToggle();
    LabelStudio.hasAutoAcceptSuggestionsToggleUnchecked();

    cy.log('Get suggestions');
    ImageView.selectSmartToolByHotkey();
    ImageView.drawRectRelative(0.175, 0.24, 0.15, 0.32);

    cy.get('@getImageOcrSuggestions').should('be.calledOnce');
    cy.log('Should see suggestions');

    let firstSuggestion;

    cy.window((win) => {
      expect(win.Htx.annotationStore.selected.suggestions.size).equal(1);
      firstSuggestion = win.Htx.annotationStore.selected.suggestions[0].toJSON();
    });

    cy.log('Reject suggestion but keep dynamic region to re-request suggestions');
    ImageView.clickAtRelative(0.16, 0.59);

    cy.log('For this moment it should be only one request to the server');
    cy.get('@getImageOcrSuggestions').should('be.calledOnce');

    cy.log('Change perRegion value');
    Sidebar.toggleRegionSelection(0);
    Textarea.type('Header 2{enter}');

    cy.log('Accept suggestion');
    ImageView.clickAtRelative(0.155, 0.325);

    cy.log('The suggestion should be accepted and should replace actual region');
    Sidebar.hasRegions(1);
    cy.window((win) => {
      expect(win.Htx.annotationStore.selected.suggestions.size).equal(0);
    });

    cy.log('And it should not call ML once again');
    cy.get('@getImageOcrSuggestions').should('be.calledTwice');

    cy.log('We also need to check that server is able to make different responses depending on textarea content');
    cy.window((win) => {
      const secondSuggestion = win.Htx.annotationStore.selected.suggestions[0].toJSON();

      for (const [key, value] of Object.entries(firstSuggestion[0].value)) {
        expect(value).not.to.be.equal(secondSuggestion[0].value[key]);
      }
      expect(firstSuggestion[1].value.text).not.to.be.equal(secondSuggestion[1].value.text);
    });
  });
});

describe('Auto Accept - TextArea', () => {
  for (const ffLLMState of FF_LLM_STATES) {
    it(`should depend on auto accept annotation toggle with FF_LLM_EPIC={${ffLLMState ? 'on' : 'off'}}`, () => {
      LabelStudio.addFeatureFlagsOnPageLoad({
        [FF_LLM_EPIC]: ffLLMState,
      });

      const listeners = {
        getLlmTextareaSuggestions,
      };

      cy.spy(listeners, 'getLlmTextareaSuggestions').as('getLlmTextareaSuggestions');

      LabelStudio.params()
        .config(llmTextareaConfig)
        .data(llmTextareaData)
        .withResult([])
        .withInterface('auto-annotation')
        .withEventListener('regionFinishedDrawing', listeners.getLlmTextareaSuggestions)
        .init();

      const promptTextArea = useTextarea('&:eq(0)');
      const answerTextArea = useTextarea('&:eq(1)');

      LabelStudio.waitForObjectsReady();

      LabelStudio.hasAutoAnnotationToggle();
      LabelStudio.hasAutoAnnotationToggleUnchecked();

      cy.log('Try to get suggestions without auto accept toggled on');
      promptTextArea.type(`${LLM_WHAT_DO_YOU_SEE.prompt}{shift+enter}`);

      cy.log('It shouldn\'t send request to get suggestions');
      cy.get('@getLlmTextareaSuggestions').should('not.to.have.been.called');

      cy.log('Clear prompt text area');
      cy.get('body').type('{ctrl+z}');

      cy.log('Switch auto annotation mode');
      LabelStudio.toggleAutoAnnotation();
      LabelStudio.hasAutoAnnotationToggleChecked();

      promptTextArea.type(`${LLM_WHAT_DO_YOU_SEE.prompt}{shift+enter}`);
      answerTextArea.hasValue(LLM_WHAT_DO_YOU_SEE.answer);
      cy.get('@getLlmTextareaSuggestions').should('to.have.been.calledOnce');
    });

    it(`should auto accept suggestions in any case with FF_LLM_EPIC={${ffLLMState ? 'on' : 'off'}}`, () => {
      LabelStudio.addFeatureFlagsOnPageLoad({
        [FF_LLM_EPIC]: ffLLMState,
      });

      LabelStudio.params()
        .config(llmTextareaConfig)
        .data(llmTextareaData)
        .withResult([])
        .withInterface('auto-annotation')
        .withEventListener('regionFinishedDrawing', getLlmTextareaSuggestions)
        .withParam('forceAutoAnnotation', true)
        .init();

      const promptTextArea = useTextarea('&:eq(0)');
      const answerTextArea = useTextarea('&:eq(1)');

      LabelStudio.waitForObjectsReady();
      LabelStudio.hasNoAutoAcceptSuggestionsToggle();

      cy.log('Get suggestions');
      promptTextArea.type(`${LLM_WHAT_DO_YOU_SEE.prompt}{shift+enter}`);
      answerTextArea.hasValue(LLM_WHAT_DO_YOU_SEE.answer);

      cy.log('There should not be any suggestions');
      cy.window((win) => {
        expect(win.Htx.annotationStore.selected.suggestions.size).equal(0);
      });
    });

    it(`should have grouped regions at \`regionFinishedDrawing\` event (FF_LLM_EPIC={${ffLLMState ? 'on' : 'off'}})`, () => {
      LabelStudio.addFeatureFlagsOnPageLoad({
        [FF_LLM_EPIC]: true,
      });

      const listeners = {
        getLlmTextareaSuggestions,
      };

      cy.spy(listeners, 'getLlmTextareaSuggestions').as('getLlmTextareaSuggestions');

      LabelStudio.params()
        .config(llmTextareaConfig)
        .data(llmTextareaData)
        .withResult([])
        .withInterface('auto-annotation')
        .withEventListener('regionFinishedDrawing', listeners.getLlmTextareaSuggestions)
        .withParam('forceAutoAnnotation', true)
        .init();

      LabelStudio.waitForObjectsReady();
      LabelStudio.hasNoAutoAcceptSuggestionsToggle();

      const promptTextArea = useTextarea('&:eq(0)');

      cy.log('Generate an event');
      promptTextArea.type(`${LLM_WHAT_DO_YOU_SEE.prompt}{shift+enter}`);

      cy.get('@getLlmTextareaSuggestions')
        .should('be.calledOnce')
        .then((spy) => {
          const callArgs = spy.getCall(0).args;

          expect(callArgs[1].length).to.be.equal(1);
          expect(callArgs[0]).to.be.deep.equal(callArgs[1][0]);
        });
    });
  }
});

describe('Auto Accept - Audio', () => {
  for (const ffLLMState of FF_LLM_STATES) {
    it(`should auto accept suggestions in any case with FF_LLM_EPIC={${ffLLMState ? 'on' : 'off'}}`, () => {
      LabelStudio.addFeatureFlagsOnPageLoad({
        [FF_LLM_EPIC]: ffLLMState,
        [FF_DEV_2715]: true,
      });

      const listeners = {
        getAudioSuggestions,
      };

      cy.stub(listeners, 'getAudioSuggestions').as('getAudioSuggestions');

      LabelStudio.params()
        .config(audioConfig)
        .data(audioData)
        .withResult([])
        .withInterface('auto-annotation')
        .withEventListener('regionFinishedDrawing', listeners.getAudioSuggestions)
        .withParam('forceAutoAnnotation', true)
        .init();

      LabelStudio.waitForObjectsReady();
      AudioView.isReady();
      LabelStudio.hasNoAutoAcceptSuggestionsToggle();

      cy.log('Get suggestions');

      Labels.select('Sound');
      AudioView.drawRectRelative(.22, .5, .05, 0);
      Sidebar.toggleRegionSelection(0);

      // cy.get('@getAudioSuggestions').should('be.called');

      cy.get('@getAudioSuggestions').should('be.calledOnce');
      cy.log('There should not be any suggestions');
      cy.window((win) => {
        expect(win.Htx.annotationStore.selected.suggestions.size).equal(0);
      });
    });
  }
});
