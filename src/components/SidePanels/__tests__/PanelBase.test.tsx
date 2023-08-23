/* global test, expect, describe */
import { PanelBase, PanelProps } from '../PanelBase';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

describe('PanelBase', () => {
  test('Panel', async () => {
    const panelName = 'details';
    const rootRef = createRef<HTMLDivElement>();
    let isCurrentlyExpanded = true;
    const sampleProps: PanelProps = {
      'top': 113,
      'left': 0,
      'relativeLeft': 0,
      'relativeTop': 13.797313797313798,
      'zIndex': 1,
      'width': 320,
      'height': 400,
      'visible': true,
      'detached': false,
      'alignment': 'left',
      'onResize': () => { },
      'onResizeStart': () => { },
      'onResizeEnd': () => { },
      'onPositionChange': () => { },
      'onVisibilityChange': (name: string, isExpanded) => { isCurrentlyExpanded = isExpanded; },
      'onPositionChangeBegin': () => { },
      'onSnap': () => { },
      // eslint-disable-next-line
      // @ts-ignore
      'root': rootRef,
      'tooltip': panelName,
      'positioning': false,
      'maxWidth': 394.8,
      'expanded': false,
      'locked': false,
      'currentEntity': {
        'id': 'BKHog',
        'pk': null,
        'selected': true,
        'type': 'annotation',
        'createdDate': '2023-02-27T10:43:14.795',
        'createdAgo': null,
        'createdBy': 'Admin',
        'user': '{avatar: null, email: "yousif@heartex.com", firstNa…}',
        'parent_prediction': null,
        'parent_annotation': null,
        'last_annotation_history': null,
        'comment_count': null,
        'unresolved_comment_count': null,
        'loadedDate': 'Mon Feb 27 2023 10:43:14 GMT-0500 (Eastern Standard Time)',
        'leadTime': null,
        'userGenerate': true,
        'update': false,
        'sentUserGenerate': false,
        'localUpdate': false,
        'ground_truth': false,
        'skipped': false,
        'history': '{createdIdx: 0, history: Array(1), isFrozen: false,…}',
        'dragMode': false,
        'editable': true,
        'readonly': false,
        'relationMode': false,
        'relationStore': '{_relations: Array(0), highlighted: undefined, show…}',
        'areas': {},
        'suggestions': {},
        'regionStore': {},
        'isDrawing': false,
        'commentStore': {},
        'hidden': false,
        'draftId': 0,
        'draftSelected': false,
        'autosaveDelay': 5000,
        'isDraftSaving': false,
        'versions': '{draft: undefined, result: Array(0)}',
        'resultSnapshot': '',
        'autosave': () => { },
      },
    };
    const sampleContent = 'Sample Panel';
    const view = render(<>
      <PanelBase {...sampleProps} name={panelName} title={panelName}>
        {sampleContent}
      </PanelBase>
    </>);

    expect(view.getByText(panelName)).toBeInTheDocument();
    expect(view.getByText(sampleContent)).toBeInTheDocument();
    expect(isCurrentlyExpanded).toBe(true);

    await userEvent.click(view.getByTestId("panel-toggle-collapsed"));
    expect(isCurrentlyExpanded).toBe(false);
  });
});
