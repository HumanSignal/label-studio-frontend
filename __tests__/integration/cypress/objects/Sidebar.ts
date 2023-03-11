import { LabelStudio } from './LabelStudio';
import { FF_DEV_1170 } from '../../feature-flags';

export const Sidebar = {
  get outliner() {
    return cy.get('.lsf-outliner');
  },
  get legacySidebar() {
    return cy.get('.lsf-sidebar-tabs');
  },
  get regions(){
    if (LabelStudio.getFeatureFlag(FF_DEV_1170)) {
      return this.outliner
        .should('be.visible')
        .get('.lsf-tree-node-content-wrapper');
    }

    return this.legacySidebar
      .should('be.visible')
      .get('.lsf-region-item');
  },
  hasRegions(value: number) {
    this.regions.should('have.length', value);
  },
  hasNoRegions() {
    this.regions.should('not.exist');
  },
};
