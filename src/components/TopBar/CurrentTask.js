import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';
import { Button } from '../../common/Button/Button';
import { Block, Elem } from '../../utils/bem';
import { FF_DEV_3873, FF_DEV_4174, isFF } from '../../utils/feature-flags';
import { guidGenerator } from '../../utils/unique';
import { isDefined } from '../../utils/utilities';
import './CurrentTask.styl';
import { reaction } from 'mobx';
import { Tooltip } from '../../common/Tooltip/Tooltip';

export const CurrentTask = observer(({ store }) => {
  const [initialCommentLength, setInitialCommentLength] = useState(0);
  const [visibleComments, setVisibleComments] = useState(0);

  useEffect(() => {
    store.commentStore.setAddedCommentThisSession(false);

    const reactionDisposer = reaction(
      () => store.commentStore.comments.map(item => item.isDeleted),
      result => {
        setVisibleComments(result.filter(item => !item).length);
      },
    );

    return () => {
      reactionDisposer?.();
    };
  }, []);

  useEffect(() => {
    if (store.commentStore.addedCommentThisSession) {
      setInitialCommentLength(visibleComments);
    }
  }, [store.commentStore.addedCommentThisSession]);

  const historyEnabled = store.hasInterface('topbar:prevnext');
  const showCounter = store.hasInterface('topbar:task-counter');

  // @todo some interface?
  let canPostpone = !isDefined(store.annotationStore.selected.pk)
    && !store.canGoNextTask
    && !store.hasInterface('review')
    && store.hasInterface('postpone');


  if (store.hasInterface('annotations:comments') && isFF(FF_DEV_4174)) {
    canPostpone = canPostpone && store.commentStore.addedCommentThisSession && (visibleComments >= initialCommentLength);
  }

  return (
    <Elem name="section">
      <Block name="current-task" mod={{ 'with-history': historyEnabled }} style={{
        padding: isFF(FF_DEV_3873) && 0,
        width: isFF(FF_DEV_3873) && 'auto',
      }}>
        <Elem name="task-id" style={{ fontSize: isFF(FF_DEV_3873) ? 12 : 14 }}>
          {store.task.id ?? guidGenerator()}
          {historyEnabled && showCounter && (
            <Tooltip name={'task-count'} title={`${store.queuePosition} tasks complete of ${store.queueTotal} total tasks`}>
              <Elem name="task-count">
                {store.queuePosition} of {store.queueTotal}
              </Elem>
            </Tooltip>
          )}
        </Elem>
        {historyEnabled && (
          <Elem name="history-controls" mod={{ newui: isFF(FF_DEV_3873) }} >
            <Elem
              tag={Button}
              name="prevnext"
              mod={{ prev: true, disabled: !store.canGoPrevTask, newui: isFF(FF_DEV_3873) }}
              type="link"
              disabled={!historyEnabled || !store.canGoPrevTask}
              onClick={store.prevTask}
              style={{ background: !isFF(FF_DEV_3873) && 'none', backgroundColor: isFF(FF_DEV_3873) && 'none' }}
            />
            <Elem
              tag={Button}
              name="prevnext"
              mod={{
                next: true,
                disabled: !store.canGoNextTask && !canPostpone,
                postpone: !store.canGoNextTask && canPostpone,
                newui: isFF(FF_DEV_3873),
              }}
              type="link"
              disabled={!store.canGoNextTask && !canPostpone}
              onClick={store.canGoNextTask ? store.nextTask : store.postponeTask}
              style={{ background: !isFF(FF_DEV_3873) && 'none', backgroundColor: isFF(FF_DEV_3873) && 'none' }}
            />
          </Elem>
        )}
      </Block>
    </Elem>
  );
});
