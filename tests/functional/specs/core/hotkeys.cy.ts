import { Labels, LabelStudio } from '@heartexlabs/ls-test/helpers/LSF';
import {
  createConfigWithHotkey
} from '../../data/core/hotkeys';
import { Generator } from '@heartexlabs/ls-test/helpers/common/Generator';

describe('Hotkeys', () => {
  const hotkeysToCheck = [
    ['L', 'r'],
    ['ctrl+L', 'ctrl+r'],
    [','],
    [',',',',','], // it won't work with odd number of commas 'cause 2 calls of selecting label cancel each other
    ['a',','],
    [',','b'],
    ['a',',','b'],
    ['ctrl+,','ctrl+.'],
    ['ctrl+.','ctrl+,'],
  ];

  for (const hotkeys of hotkeysToCheck) {
    const hotkeyString = hotkeys.join(',');

    it(`should be able to use hotkey ${hotkeyString}`, () => {
      Generator.generateImageUrl({ width: 800, height: 50 })
        .then(imageUrl => {
          LabelStudio.params()
            .config(createConfigWithHotkey(hotkeyString))
            .data({ image: imageUrl })
            .withResult([])
            .init();
        });

      LabelStudio.waitForObjectsReady();
      Labels.label.should('have.length', 1);

      cy.log('Check that hotkeys work');
      for (const hotkey of hotkeys) {
        const hotkeyInput = hotkey.includes('+') ? `{${hotkey}}` : `${hotkey}`;

        // try to use hotkey
        cy.get('body').type(hotkeyInput);
        Labels.selectedLabel.contains('Label');
        // deselect
        cy.get('body').type('{esc}');
      }

      cy.log('Reload LS');
      cy.window().then(win => {
        win.LabelStudio.destroyAll();
        new win.LabelStudio('label-studio', win.LSF_CONFIG);
      });

      LabelStudio.waitForObjectsReady();
      Labels.label.should('have.length', 1);

      cy.log('Check that hotkeys still work');
      for (const hotkey of hotkeys) {
        const hotkeyInput = hotkey.includes('+') ? `{${hotkey}}` : `${hotkey}`;

        // try to use hotkey
        cy.get('body').type(hotkeyInput);
        Labels.selectedLabel.contains('Label');
        // deselect
        cy.get('body').type('{esc}');
      }
    });
  }
});
