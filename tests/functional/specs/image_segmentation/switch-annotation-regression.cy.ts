import { ImageView, LabelStudio, Sidebar } from '@heartexlabs/ls-test/helpers/LSF';
import { FF_DEV_3873, FF_LSDV_5177 } from '../../../../src/utils/feature-flags';
import {
  fourToolsConfig,
  fourToolsResult,
  simpleImageData
} from '../../data/image_segmentation/switch-annotation-regression';

const resizeObserverLoopErrRe = /ResizeObserver loop limit exceeded/;

Cypress.on('uncaught:exception', (err) => {
  /* returning false here prevents Cypress from failing the test */
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false;
  }
});

describe('Image regions on switching annotations', () => {
  it('Should keep position from selected history step', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_DEV_3873]: true,
      [FF_LSDV_5177]: true,
    });

    LabelStudio.params()
      .config(fourToolsConfig)
      .data(simpleImageData)
      .withResult([])
      .withResult(fourToolsResult)
      .init();

    Sidebar.hasRegions(4);
    ImageView.waitForImage();

    cy.log('Select all regions');
    cy.get('[aria-label="move-tool"]').click();
    ImageView.drawRect(5, 5, 300, 300);

    cy.log('Move all regions to the borrom-right corner');
    ImageView.drawRect(50, 50, 300, 500);
    //There is some problem with releasing mouse in this scenario...
    cy.get('body').type('{esc}');
    cy.get('[aria-label="Undo"]').click();
    cy.get('[aria-label="Undo"]').click();
    cy.get('.lsf-annotation-button:nth-child(2)').click();
    cy.get('.lsf-annotation-button:nth-child(1)').click();

    LabelStudio.serialize().then(result => {
      JSON.parse(JSON.stringify(result, (key, value) => {
        if (Number.isFinite(value) && (key === 'x' || key === 'y' || key === '0' || key === '1')) {
          expect(value).to.be.lessThan(400);
        }
        return value;
      }));
    });
  });
});