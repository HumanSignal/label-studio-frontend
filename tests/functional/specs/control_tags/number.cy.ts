import {
  numberConfigMinMax, numberPerItemConfig,
  numberPerRegionConfig,
  numberPerRegionResult,
  numberResult,
  simpleData, simpleMIGData
} from 'data/control_tags/number';
import { ImageView, LabelStudio, Modals, Number, Sidebar, ToolBar } from '@heartexlabs/ls-test/helpers/LSF';
import { FF_LSDV_4583 } from '../../../../src/utils/feature-flags';

describe('Control Tags - Number', () => {
  it('should set value', () => {
    LabelStudio.params()
      .config(numberConfigMinMax)
      .data(simpleData)
      .withResult([])
      .init();

    LabelStudio.waitForObjectsReady();

    Number.type('42');
    Number.hasValue('42');
    LabelStudio.serialize().then(result => {
      expect(result[0].value.number).to.be.eq(42);
    });
  });

  it('should load value', () => {
    LabelStudio.params()
      .config(numberConfigMinMax)
      .data(simpleData)
      .withResult(numberResult)
      .init();

    LabelStudio.waitForObjectsReady();

    Number.hasValue('42');
  });

  it('should be limited by min/max', () => {
    LabelStudio.params()
      .config(numberConfigMinMax)
      .data(simpleData)
      .withResult([])
      .init();

    LabelStudio.waitForObjectsReady();

    Number.type('126{upArrow}{upArrow}{upArrow}');
    Number.hasValue('128');

    Number.selectAll();
    Number.type('6{downArrow}{downArrow}{downArrow}{downArrow}{downArrow}');
    Number.hasValue('2');
  });
  it('should show errors for min validation', () => {
    LabelStudio.params()
      .config(numberConfigMinMax)
      .data(simpleData)
      .withResult([])
      .init();

    LabelStudio.waitForObjectsReady();

    Number.selectAll();
    Number.type('-100');
    ToolBar.clickSubmit();
    Modals.hasWarning('-100');
    Modals.hasWarning('Value must be greater than or equal to 2');
  });

  it('should show errors for max validation', () => {
    LabelStudio.params()
      .config(numberConfigMinMax)
      .data(simpleData)
      .withResult([])
      .init();

    LabelStudio.waitForObjectsReady();

    Number.selectAll();
    Number.type('148');
    ToolBar.clickSubmit();
    Modals.hasWarning('148');
    Modals.hasWarning('Value must be less than or equal to 128');
  });

  it('should show errors for step validation', () => {
    LabelStudio.params()
      .config(numberConfigMinMax)
      .data(simpleData)
      .withResult([])
      .init();

    LabelStudio.waitForObjectsReady();

    // Check step=2
    Number.selectAll();
    Number.type('43');
    ToolBar.clickSubmit();
    Modals.hasWarning('43');
    Modals.hasWarning('The two nearest valid values are 42 and 44.');
  });

  it('should show errors for perRegion validation', () => {
    LabelStudio.params()
      .config(numberPerRegionConfig)
      .data(simpleData)
      .withResult(numberPerRegionResult)
      .init();

    LabelStudio.waitForObjectsReady();

    Sidebar.toggleRegionSelection(0);
    Number.type('43');

    Sidebar.toggleRegionSelection(1);
    Number.type('8');


    cy.log('43 is not a multiple of 2, which is set as a step in the configuration, so there should be a warning on submit');
    ToolBar.clickSubmit();
    Modals.hasWarning('43');
  });

  it('should show errors for perItem validation', () => {
    LabelStudio.addFeatureFlagsOnPageLoad({
      [FF_LSDV_4583]: true,
    });

    LabelStudio.params()
      .config(numberPerItemConfig)
      .data(simpleMIGData)
      .withResult([])
      .init();

    LabelStudio.waitForObjectsReady();

    ImageView.paginationNextBtn.click();
    Number.type('3');
    ImageView.paginationNextBtn.click();

    ToolBar.clickSubmit();
    Modals.hasWarning('3');
    Modals.closeWarning();
    // Check that we are at the right page that contains the error
    Number.hasValue('3');
  });
});
