export const ImageView = {
  get image() {
    cy.log('Get main image');
    return cy
      .get('img[alt=LS]');
  },
  get drawingArea() {
    cy.log('Get Konva.js root');
    return this.image
      .closest('[class^="frame--"]')
      .siblings()
      .get('[class^="image-element--"] .konvajs-content');
  },
  waitForImage() {
    cy.log('Make sure that the image is visible and loaded');
    this.image
      .should('be.visible')
      .and((img) => {
        return expect((img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0); 
      });

    this.drawingArea
      .get('canvas')
      .should('be.visible');
  },
  drawRect(x: number, y: number, width: number, height: number) {
    cy.log(`Draw rectangle at (${x}, ${y}) of size ${width}x${height}`);
    this.drawingArea
      .scrollIntoView()
      .trigger('mousedown', x, y, { eventConstructor: 'MouseEvent' })
      .trigger('mousemove', x + width, y + height, { eventConstructor: 'MouseEvent' })
      .trigger('mouseup', { eventConstructor: 'MouseEvent' });
  },
};
