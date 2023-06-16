import { LabelStudio, Sidebar, Tooltip } from '@heartexlabs/ls-test/helpers/LSF/index';
import { simpleRegionsConfig, simpleRegionsData, simpleRegionsResult } from 'data/outliner/hide-all';

describe('Outliner - Hide all regions', () => {
  it('should exist', () => {
    LabelStudio.params()
      .config(simpleRegionsConfig)
      .data(simpleRegionsData)
      .withResult(simpleRegionsResult)
      .init();

    Sidebar.hasRegions(3);
    Sidebar.hideAllRegionsButton
      .should('be.visible')
      .should('be.enabled');
  });

  it('should be disabled without existed regions', () => {
    LabelStudio.params()
      .config(simpleRegionsConfig)
      .data(simpleRegionsData)
      .withResult([])
      .init();

    Sidebar.hasRegions(0);
    Sidebar.hideAllRegionsButton
      .should('be.visible')
      .should('be.disabled');
  });

  it('should hide all regions', () => {
    LabelStudio.params()
      .config(simpleRegionsConfig)
      .data(simpleRegionsData)
      .withResult(simpleRegionsResult)
      .init();

    Sidebar.hasRegions(3);
    Sidebar.hasHiddenRegion(0);
    Sidebar.hideAllRegionsButton.click();
    Sidebar.hasHiddenRegion(3);
  });

  it('should show all regions', () => {
    LabelStudio.params()
      .config(simpleRegionsConfig)
      .data(simpleRegionsData)
      .withResult(simpleRegionsResult)
      .init();

    Sidebar.hasRegions(3);
    Sidebar.hideAllRegionsButton.click();
    Sidebar.hasHiddenRegion(3);
    Sidebar.showAllRegionsButton.click();
    Sidebar.hasHiddenRegion(0);
  });

  it('should hide rest regions', () => {
    LabelStudio.params()
      .config(simpleRegionsConfig)
      .data(simpleRegionsData)
      .withResult(simpleRegionsResult)
      .init();

    Sidebar.hasRegions(3);
    Sidebar.toggleRegionVisibility(1);
    Sidebar.hasHiddenRegion(1);
    Sidebar.hideAllRegionsButton.click();
    Sidebar.hasHiddenRegion(3);
  });

  it('should have tooltip for hide action', () => {
    LabelStudio.params()
      .config(simpleRegionsConfig)
      .data(simpleRegionsData)
      .withResult(simpleRegionsResult)
      .init();

    Sidebar.hasRegions(3);
    Sidebar.hideAllRegionsButton.trigger('mouseenter');
    Tooltip.hasText('Hide all regions');
  });

  it('should have tooltip for show action', () => {
    LabelStudio.params()
      .config(simpleRegionsConfig)
      .data(simpleRegionsData)
      .withResult(simpleRegionsResult)
      .init();

    Sidebar.hasRegions(3);
    Sidebar.hideAllRegionsButton.click();
    Sidebar.showAllRegionsButton.trigger('mouseenter');
    Tooltip.hasText('Show all regions');
  });
  it('should react to changes in regions\' visibility', () => {
    LabelStudio.params()
      .config(simpleRegionsConfig)
      .data(simpleRegionsData)
      .withResult(simpleRegionsResult)
      .init();

    Sidebar.hasRegions(3);
    Sidebar.hideAllRegionsButton.click();

    Sidebar.showAllRegionsButton
      .should('be.visible');
    Sidebar.toggleRegionVisibility(1);
    Sidebar.hideAllRegionsButton
      .should('be.visible');
  });
});