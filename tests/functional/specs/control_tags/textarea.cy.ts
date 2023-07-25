import { LabelStudio, Textarea } from '@heartexlabs/ls-test/helpers/LSF/index';
import {
  simpleData,
  textareaConfigSimple
} from '../../data/control_tags/textarea';

describe('Control Tags - TextArea - Lead Time', () => {
  it('should calculate lead_time for global TextArea', () => {
    LabelStudio.params()
      .config(textareaConfigSimple)
      .data(simpleData)
      .withResult([])
      .init();

    Textarea.type('This is a test{enter}');
    Textarea.hasValue('This is a test');

    LabelStudio.serialize().then(result => {
      const lead_time = result[0].meta.lead_time;

      expect(result.length).to.be.eq(1);
      expect(lead_time).to.be.gt(0);

      Textarea.type('Another test{enter}');

      LabelStudio.serialize().then(result2 => {
        expect(result2[0].meta.lead_time).to.be.gt(lead_time);
      });
    });
  });
});
