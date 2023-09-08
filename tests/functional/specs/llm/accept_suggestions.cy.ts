import { LabelStudio, useTextarea } from '@heartexlabs/ls-test/helpers/LSF';
import {
  LLM_WHAT_DO_YOU_SEE, LLM_WHAT_ELSE_DO_YOU_SEE,
  llmTextareaConfig,
  llmTextareaData,
  llmTextareaSuggestions
} from 'data/lmm/accept_suggestions';
import { FF_DEV_1284, FF_LLM_EPIC } from '../../../../src/utils/feature-flags';

function getLLMSuggestions(area, connectedRegions) {
  const prompt = area?.results?.[0]?.value?.text?.[0];

  if (prompt) {
    const suggestions = llmTextareaSuggestions[prompt];

    setTimeout(() => {
      area.store.loadSuggestions(new Promise((resolve) => setTimeout(() => {
        resolve(suggestions);
      }, 1000)), x => x);
    }, 1000);
  }
}

describe('LLM scenario', () => {
  beforeEach(() => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_LLM_EPIC]: true,
    });
  });

  it('Accept suggestions - TextArea', () => {

    LabelStudio.params()
      .config(llmTextareaConfig)
      .data(llmTextareaData)
      .withResult([])
      .withInterface('auto-annotation')
      .withEventListener('regionFinishedDrawing', getLLMSuggestions)
      .withParam('forceAutoAnnotation', true)
      .init();
    const promptTextAarea = useTextarea('&:eq(0)');
    const answerTextArea = useTextarea('&:eq(1)');

    promptTextAarea.type(`${LLM_WHAT_DO_YOU_SEE.prompt}{shift+enter}`);
    answerTextArea.hasValue(LLM_WHAT_DO_YOU_SEE.answer);
    promptTextAarea.clickRowEdit(1);
    promptTextAarea.rowType(1, `{selectAll}{backspace}${LLM_WHAT_ELSE_DO_YOU_SEE.prompt}{shift+enter}`);
    answerTextArea.hasValue(LLM_WHAT_ELSE_DO_YOU_SEE.answer);

    LabelStudio.serialize().then((result) => {
      expect(result.length).to.be.equal(2);
    });
  });
});