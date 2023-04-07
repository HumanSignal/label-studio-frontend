import { observer } from 'mobx-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../common/Button/Button';
import { Block, Elem } from '../../utils/bem';
import { FF_DEV_3034, FF_DEV_4174, isFF } from '../../utils/feature-flags';
import { guidGenerator } from '../../utils/unique';
import { isDefined } from '../../utils/utilities';
import './CurrentTask.styl';
import { reaction } from 'mobx';


export const CurrentTask = observer(({ store }) => {
  const [initialCommentLength, setInitialCommentLength] = useState(0);
  const [visibleComments, setVisibleComments] = useState(0);

  useEffect(() => {
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

  const currentIndex = useMemo(() => {
    return store.taskHistory.findIndex((x) => x.taskId === store.task.id) + 1;
  }, [store.taskHistory]);

  useEffect(() => {
    if (store.commentStore.addedCommentThisSession) {
      setInitialCommentLength(visibleComments);
    }
  }, [store.commentStore.addedCommentThisSession]);

  const historyBasedTaskList = store.hasInterface('topbar:prev-next-history');
  const showCounter = store.hasInterface('topbar:task-counter');

  // @todo some interface?
  let canPostpone = isFF(FF_DEV_3034)
    && !isDefined(store.annotationStore.selected.pk)
    && !store.canGoNextTask
    && !store.hasInterface('review')
    && store.hasInterface('postpone');


  if (isFF(FF_DEV_4174)) {
    canPostpone = canPostpone && store.commentStore.addedCommentThisSession && (visibleComments >= initialCommentLength);
  }
  return (
    <Elem name="section">
      <Block name="current-task" mod={{ 'with-history': historyBasedTaskList }}>
        <Elem name="task-id">
          {store.task.id ?? guidGenerator()}
          {historyBasedTaskList && showCounter && (
            <Elem name="task-count">
              {currentIndex} of {store.taskHistory.length}
            </Elem>
          )}
        </Elem>
        {historyBasedTaskList ? (
          <Elem name="history-controls">
            <Elem
              tag={Button}
              name="prevnext"
              mod={{ prev: true, disabled: !store.canGoPrevHistoryTask }}
              type="link"
              disabled={!historyBasedTaskList || !store.canGoPrevHistoryTask}
              onClick={store.prevTask}
              style={{ background: 'none', backgroundColor: 'none' }}
            />
            <Elem
              tag={Button}
              name="prevnext"
              mod={{
                next: true,
                disabled: !store.canGoNextHistoryTask && !canPostpone,
                postpone: !store.canGoNextHistoryTask && canPostpone,
              }}
              type="link"
              disabled={!store.canGoNextHistoryTask && !canPostpone}
              onClick={store.canGoNextHistoryTask ? store.nextTask : store.postponeTask}
              style={{ background: 'none', backgroundColor: 'none' }}
            />
          </Elem>
        ) : (
          <Elem name="history-controls">
            <Elem
              tag={Button}
              name="prevnext"
              mod={{
                prev: true,
                disabled: !store.adjacentTaskIds?.prevTaskId,
              }}
              type="link"
              disabled={!store.adjacentTaskIds?.prevTaskId}
              onClick={store.prevTask}
              style={{ background: 'none', backgroundColor: 'none' }}
            />
            <Elem
              tag={Button}
              name="prevnext"
              mod={{
                next: true,
                disabled: !store.adjacentTaskIds?.nextTaskId,
              }}
              type="link"
              disabled={!store.adjacentTaskIds?.nextTaskId}
              onClick={store.nextTask}
              style={{ background: 'none', backgroundColor: 'none' }}
            />
          </Elem>
        )}
      </Block>
    </Elem>
  );
});
