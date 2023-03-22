import { emptyPanel, PanelBBox, Side } from '../types';
import { determineDroppableArea, determineLeftOrRight, getSnappedHeights, joinPanelColumns, setActive, setActiveDefaults, splitPanelColumns, stateAddedTab, stateRemovedTab, stateRemovePanelEmptyViews } from '../utils';


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
    alignment: Side.left,
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
    alignment: Side.right,
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

    expect(determineLeftOrRight(event)).toBe(Side.right);
  });

  it('returns DroppableSide.left when the event x position is less than half the droppable element width', () => {
    const event = {
      pageX: 200,
      target: {
        clientWidth: 800,
        getBoundingClientRect: () => ({ left: 0 }),
      },
    };

    expect(determineLeftOrRight(event)).toBe(Side.left);
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

  const state = { ...dummyPanels };
  
  it('should remove the specified tab from the specified panel', () => {
    const panelName = 'p1';
    const tabToRemove = 1;
  
    const expectedPanelViews = [
      { title: 'Tab 1', name: 'Tab1', component: () => null, active: true },
      { title: 'Tab 3', name: 'Tab3', component: () => null, active: false },
    ];
  
    const expectedState = {
      ...state,
      [panelName]: {
        ...state[panelName],
        panelViews: expectedPanelViews,
      },
    };
  
    const newState = stateRemovedTab(state, panelName, tabToRemove);
  
    expect(JSON.stringify(newState)).toEqual(JSON.stringify(expectedState));
  });
  
  it('should return the same state if the specified panel or tab does not exist', () => {
    const nonExistentPanelName = 'nonexistent';
    const nonExistentTab = 5;
    const newState = stateRemovedTab(state, nonExistentPanelName, nonExistentTab);
  
    expect(newState).toEqual(state);
  });
});

describe('setActive', () => {
      
  const panelName = 'p1';
  const tabIndex = 1;
  
  it('should set the correct tab as active', () => {
    const expectedPanelViews = [
      { title: 'Tab 1', name: 'Tab1', component: () => null, active: false },
      { title: 'Tab 3', name: 'Tab3', component: () => null, active: true },
    ];
  
    const expectedState = {
      ...dummyPanels,
      [panelName]: {
        ...dummyPanels[panelName],
        panelViews: expectedPanelViews,
      },
    };
  
    const newState = setActive(dummyPanels, panelName, tabIndex);
        
    expect(JSON.stringify(newState)).toEqual(JSON.stringify(expectedState));
  });
  
  it('should not modify the original state object', () => {
    const stateBefore = { ...dummyPanels };

    setActive(dummyPanels, panelName, tabIndex);
    expect(dummyPanels).toEqual(stateBefore);
  });
  
  it('should return a new state object', () => {
    const newState = setActive(dummyPanels, panelName, tabIndex);

    expect(newState).not.toBe(dummyPanels);
  });
});
  
describe('setActiveDefaults', () => {
  it('sets the first tab as active if no tabs are currently active', () => {
    const state = {
      panel1: {
        panelViews: [
          { title: 'Tab 1', name: 'Tab1', component: () => null, active: false },
          { title: 'Tab 2', name: 'Tab2', component: () => null, active: false },
          { title: 'Tab 3', name: 'Tab3', component: () => null, active: false },
        ],
      },
      panel2: {
        panelViews: [
          { title: 'Tab 4', name: 'Tab4', component: () => null, active: false },
          { title: 'Tab 5', name: 'Tab5', component: () => null, active: false },
        ],
      },
    };
    const newState = setActiveDefaults(state);
      
    expect(newState['panel1'].panelViews[0].active).toBe(true);
    expect(newState['panel2'].panelViews[0].active).toBe(true);
  });
  
  it('does not change active tabs if there are already active tabs', () => {
    const state = {
      panel1: {
        panelViews: [
          { title: 'Tab 1', name: 'Tab1', component: () => null, active: false },
          { title: 'Tab 2', name: 'Tab2', component: () => null, active: true },
          { title: 'Tab 3', name: 'Tab3', component: () => null, active: false },
        ],
      },
      panel2: {
        panelViews: [
          { title: 'Tab 4', name: 'Tab4', component: () => null, active: true },
          { title: 'Tab 5', name: 'Tab5', component: () => null, active: false },
        ],
      },
    };
  
    const newState = setActiveDefaults(state);
    const p1t2Active = newState['panel1'].panelViews[1].active;
    const p2t1Active = newState['panel2'].panelViews[0].active;

    expect(p1t2Active).toBe(true);
    expect(p2t1Active).toBe(true);
  });
});
    
describe('stateAddedTab', () => {
  const panelName = 'panel1';
  const initialPanelViews = [
    { title: 'Tab 1', name: 'Tab1', component: () => null, active: true },
    { title: 'Tab 2', name: 'Tab2', component: () => null, active: false },
  ];
  
  const state: Record<string, PanelBBox> = {
    [panelName]: { panelViews: initialPanelViews } as unknown as PanelBBox,
  };
  
  it('adds a new tab to the receiving panel on the right', () => {
    const movingTabData = { title: 'Tab 3', name: 'Tab3', component: () => null, active: false };
    const receivingTab = 1;
    const dropSide = Side.right;
  
    const expectedPanelViews = [
      { title: 'Tab 1', name: 'Tab1', component: () => null, active: true },
      { title: 'Tab 2', name: 'Tab2', component: () => null, active: false },
      { title: 'Tab 3', name: 'Tab3', component: () => null, active: false },
    ];
  
    const expectedState = {
      ...state,
      [panelName]: {
        panelViews: expectedPanelViews,
      },
    };
  
    const newState = stateAddedTab(state, panelName, movingTabData, receivingTab, dropSide);
  
    expect(JSON.stringify(newState)).toEqual(JSON.stringify(expectedState));
  });
 
  it('adds a new tab to the receiving panel on the left', () => {
    const movingTabData = { title: 'Tab 3', name: 'Tab3', component: () => null, active: false };
    const receivingTab = 1;
    const dropSide = Side.left;
  
    const expectedPanelViews = [
      { title: 'Tab 1', name: 'Tab1', component: () => null, active: true },
      { title: 'Tab 3', name: 'Tab3', component: () => null, active: false },
      { title: 'Tab 2', name: 'Tab2', component: () => null, active: false },
      { title: 'Tab 3', name: 'Tab3', component: () => null, active: false },
    ];
  
    const expectedState = {
      ...state,
      [panelName]: {
        panelViews: expectedPanelViews,
      },
    };
      
    const newState = stateAddedTab(state, panelName, movingTabData, receivingTab, dropSide);
      
    expect(JSON.stringify(newState)).toEqual(JSON.stringify(expectedState));
  });
});
  
describe('stateRemovePanelEmptyViews', () => {
  const panelName = 'panel1';
  const initialPanelViews = [
    { title: 'Tab 1', name: 'Tab1', component: () => null, active: true },
  ];
  
  const state: Record<string, PanelBBox> = {
    [panelName]: { panelViews: initialPanelViews } as unknown as PanelBBox,
    'panel2': { panelViews: [] } as unknown as PanelBBox,
  };
  
  it('removes empty panel views from the state', () => {
    const expectedState = {
      [panelName]: { panelViews: initialPanelViews } as unknown as PanelBBox,
    };
  
    const newState = stateRemovePanelEmptyViews(state);
  
    expect(newState).toEqual(expectedState);
  });
});
  
describe('stateRemovePanelEmptyViews', () => {
  const panelsWithEmptyViews = {
    panel1: {
      top: 0,
      left: 0,
      relativeLeft: 0,
      relativeTop: 0,
      zIndex: 1,
      width: 500,
      height: 500,
      visible: true,
      detached: false,
      alignment: Side.left,
      maxHeight: 800,
      panelViews: [],
    },
    panel2: {
      top: 0,
      left: 0,
      relativeLeft: 0,
      relativeTop: 0,
      zIndex: 1,
      width: 500,
      height: 500,
      visible: true,
      detached: true,
      alignment: Side.right,
      maxHeight: 800,
      panelViews: [
        { title: 'Tab 4', name: 'Tab4', component: () => null, active: true },
      ],
    },
  };
  
  const panelsWithNonEmptyViews = {
    panel1: {
      top: 0,
      left: 0,
      relativeLeft: 0,
      relativeTop: 0,
      zIndex: 1,
      width: 500,
      height: 500,
      visible: true,
      detached: false,
      alignment: Side.left,
      maxHeight: 800,
      panelViews: [
        { title: 'Tab 1', name: 'Tab1', component: () => null, active: true },
        { title: 'Tab 2', name: 'Tab2', component: () => null, active: false },
        { title: 'Tab 3', name: 'Tab3', component: () => null, active: false },
      ],
    },
    panel2: {
      top: 0,
      left: 0,
      relativeLeft: 0,
      relativeTop: 0,
      zIndex: 1,
      width: 500,
      height: 500,
      visible: true,
      detached: true,
      alignment: Side.right,
      maxHeight: 800,
      panelViews: [
        { title: 'Tab 4', name: 'Tab4', component: () => null, active: true },
      ],
    },
  };
  
  it('removes panels with empty views from state', () => {
    const result = stateRemovePanelEmptyViews(panelsWithEmptyViews);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result.panel2).toEqual(panelsWithEmptyViews.panel2);
  });
  
  it('removes empty views from panels', () => {
    const result = stateRemovePanelEmptyViews(panelsWithNonEmptyViews);

    expect(result.panel1.panelViews).not.toHaveLength(0);
    expect(result.panel2.panelViews).not.toHaveLength(0);
  });
});

describe('splitPanelColumns', () => {
  const panel1: PanelBBox = emptyPanel;
  const panel2: PanelBBox = emptyPanel;
  const panel3: PanelBBox = emptyPanel;
  const state = {
    panel1,
    panel2,
    panel3,
  };
  const sameSidePanelKeys = ['panel1', 'panel2', 'panel3'];
  const removingKey = 'panel2';
  const totalHeight = 300;

  it('should update the height of panels on the same side', () => {
    const result = splitPanelColumns(state, sameSidePanelKeys, removingKey, totalHeight);

    expect(result['panel1'].height).toBe(150);
    expect(result['panel3'].height).toBe(150);
  });

  it('should return a new state with the removed panel and its attributes', () => {
    const result = splitPanelColumns(state, sameSidePanelKeys, removingKey, totalHeight);

    expect(result['panel2'].width).toBe(320);
    expect(result['panel2'].height).toBe(400);
    expect(result['panel2'].detached).toBe(true);
  });

  it('should not modify the original state', () => {
    splitPanelColumns(state, sameSidePanelKeys, removingKey, totalHeight);

    expect(state['panel1'].height).toBe(150);
    expect(state['panel2'].height).toBe(150);
    expect(state['panel3'].height).toBe(150);
  });
});

describe('joinPanelColumns', () => {
  const panel1: PanelBBox = {
    width: 200,
    height: 100,
    left: 0,
    top: 0,
    relativeLeft: 0,
    relativeTop: 0,
    maxHeight: 300,
    zIndex: 1,
    visible: true,
    detached: false,
    alignment: Side.left,
    panelViews: [],
  };
  const panel2: PanelBBox = {
    width: 200,
    height: 100,
    left: 0,
    top: 100,
    relativeLeft: 0,
    relativeTop: 0,
    maxHeight: 300,
    zIndex: 1,
    visible: true,
    detached: false,
    alignment: Side.left,
    panelViews: [],
  };
  const panel3: PanelBBox = {
    width: 200,
    height: 100,
    left: 0,
    top: 200,
    relativeLeft: 0,
    relativeTop: 0,
    maxHeight: 300,
    zIndex: 1,
    visible: true,
    detached: false,
    alignment: Side.left,
    panelViews: [],
  };
  const state: Record<string, PanelBBox> = {
    panel1,
    panel2,
    panel3,
  };
  const sameSidePanelKeys = ['panel1', 'panel2'];
  const panelAddKey = 'panel3';
  const alignment = 'left';
  const totalHeight = 300;
  const width = 200;

  it('should update the height, width, top, alignment, and detached properties of panels on the same side', () => {
    const result = joinPanelColumns(state, sameSidePanelKeys, panelAddKey, alignment, totalHeight, width);

    expect(result['panel1'].height).toBe(150);
    expect(result['panel1'].width).toBe(200);
    expect(result['panel1'].top).toBe(0);
    expect(result['panel1'].alignment).toBe('left');
    expect(result['panel1'].detached).toBe(false);

    expect(result['panel2'].height).toBe(150);
    expect(result['panel2'].width).toBe(200);
    expect(result['panel2'].top).toBe(150);
    expect(result['panel2'].alignment).toBe('left');
    expect(result['panel2'].detached).toBe(false);

    expect(result['panel3'].height).toBe(150);
    expect(result['panel3'].width).toBe(200);
    expect(result['panel3'].top).toBe(300);
    expect(result['panel3'].alignment).toBe('left');
    expect(result['panel3'].detached).toBe(false);
  });

  it('should add the panel to the same side panel keys array', () => {
    const result = joinPanelColumns(state, sameSidePanelKeys, panelAddKey, alignment, totalHeight, width);

    expect(JSON.stringify(result)).toContain('panel3');
  });

  it('should return a new state', () => {
    const result = joinPanelColumns(state, sameSidePanelKeys, panelAddKey, alignment, totalHeight, width);

    expect(result).not.toBe(state);
  });
});


describe('getSnappedHeights', () => {
  const state: Record<string, PanelBBox> = {
    panel1: { width: 100, height: 100, left: 0, top: 0, relativeLeft: 0, relativeTop: 0, maxHeight: 0, zIndex: 0, visible: true, detached: false, alignment: Side.left, panelViews: [] },
    panel2: { width: 100, height: 100, left: 0, top: 0, relativeLeft: 0, relativeTop: 0, maxHeight: 0, zIndex: 0, visible: true, detached: false, alignment: Side.left, panelViews: [] },
    panel3: { width: 100, height: 100, left: 0, top: 0, relativeLeft: 0, relativeTop: 0, maxHeight: 0, zIndex: 0, visible: true, detached: false, alignment: Side.right, panelViews: [] },
  };

  it('should evenly distribute heights for panels on the left and 100% of the panel on the left', () => {
    const totalHeight = 300;
    const expectedState = {
      ...state,
      panel1: { ...state.panel1, height: 150 },
      panel2: { ...state.panel2, height: 150 },
      panel3: { ...state.panel3, height: 300 },
    };

    expect(getSnappedHeights(state, totalHeight)).toEqual(expectedState);
  });

  it('should not change heights of detached panels', () => {
    const detachedState = {
      ...state,
      panel1: { ...state.panel1, detached: true },
    };
    const totalHeight = 200;
    const expectedState = {
      ...detachedState,
      panel2: { ...state.panel2, height: 200 },
      panel3: { ...state.panel3, height: 200 },
    };

    expect(getSnappedHeights(detachedState, totalHeight)).toEqual(expectedState);
  });
});
