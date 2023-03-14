import { DroppableSide } from '../types';
import { determineDroppableArea, determineLeftOrRight, stateRemovedTab } from '../utils';


const dummyPanels = {
  p1: {
    top: 0,
    left: 0,
    relativeLeft: 0,
    relativeTop: 0,
    zIndex: 1,
    width: 500,
    height: 500,
    visible: true,
    detached: false,
    alignment: DroppableSide.left,
    maxHeight: 800,
    panelViews: [
      { title: 'Tab 1', name: 'Tab1', component: () => null, active: true },
      { title: 'Tab 2', name: 'Tab2', component: () => null, active: false },
      { title: 'Tab 3', name: 'Tab3', component: () => null, active: false },
    ],
  },
  p2: {
    top: 0,
    left: 0,
    relativeLeft: 0,
    relativeTop: 0,
    zIndex: 1,
    width: 500,
    height: 500,
    visible: true,
    detached: true,
    alignment: DroppableSide.right,
    maxHeight: 800,
    panelViews: [
      { title: 'Tab 4', name: 'Tab4', component: () => null, active: true },
    ],
  },
};

describe('determineLeftOrRight', () => {
    
  it('returns DroppableSide.right when the event x position is greater than half the droppable element width', () => {
    const event = {
      pageX: 500,
      target: {
        clientWidth: 800,
        getBoundingClientRect: () => ({ left: 0 }),
      },
    };

    expect(determineLeftOrRight(event)).toBe(DroppableSide.right);
  });

  it('returns DroppableSide.left when the event x position is less than half the droppable element width', () => {
    const event = {
      pageX: 200,
      target: {
        clientWidth: 800,
        getBoundingClientRect: () => ({ left: 0 }),
      },
    };

    expect(determineLeftOrRight(event)).toBe(DroppableSide.left);
  });
});

describe('determineDroppableArea', () => {
  it('returns true when the droppingElement id includes "droppable"', () => {
    const droppingElement = document.createElement('div');

    droppingElement.id = 'droppable-123';
  
    expect(determineDroppableArea(droppingElement)).toBe(true);
  });
  
  it('returns false when the droppingElement id does not include "droppable"', () => {
    const droppingElement = document.createElement('div');

    droppingElement.id = 'no';
  
    expect(determineDroppableArea(droppingElement)).toBe(false);
  });
});

describe('stateRemovedTab', () => {


  it('should remove the specified tab from the specified panel', () => {
    const state = dummyPanels;
    const movingPanel = 'p1';
    const movingTab = 1;
    const expectedNewPanelViews = [
      { title: 'Tab 1', name: 'Tab1', component: () => null, active: true },
      { title: 'Tab 3', name: 'Tab3', component: () => null, active: false },
    ];

    const newState = stateRemovedTab(state, movingPanel, movingTab);

    expect(JSON.stringify(newState[movingPanel].panelViews)).toEqual(JSON.stringify(expectedNewPanelViews));
  });

  it('should not modify the original state object', () => {
    const state = { ...dummyPanels };
    const movingPanel = 'p1';
    const movingTab = 1;

    const newState = stateRemovedTab(state, movingPanel, movingTab);

    expect(JSON.stringify(newState)).not.toBe(JSON.stringify(state));
  });

  it('should set the first tab as active if the removed tab was active', () => {
    const state = { ...dummyPanels };
    const movingPanel = 'p1';
    const movingTab = 0;

    const newState = stateRemovedTab(state, movingPanel, movingTab);
      
    console.log(newState);
    expect(newState[movingPanel].panelViews[0].active).toBe(true);
  });

  //   it('should do nothing if the specified panel does not exist in the state object', () => {
  //     const state = {};
  //     const movingPanel = 'panel1';
  //     const movingTab = 1;

  //     const newState = stateRemovedTab(state, movingPanel, movingTab);

  //     expect(newState).toEqual({});
  //   });

  //   it('should do nothing if the specified panel does not have the specified tab', () => {
  //     const state = { panel1: existingPanel };
  //     const movingPanel = 'panel1';
  //     const movingTab = 5;

  //     const newState = stateRemovedTab(state, movingPanel, movingTab);

//     expect(newState[movingPanel].panelViews).toEqual(existingPanel.panelViews);
//   });
});