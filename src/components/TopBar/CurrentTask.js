import { observer } from "mobx-react";
import { useMemo } from "react";
import { Button } from "../../common/Button/Button";
import { Block, Elem } from "../../utils/bem";
import { FF_DEV_3034, isFF } from "../../utils/feature-flags";
import { guidGenerator } from "../../utils/unique";
import "./CurrentTask.styl";


export const CurrentTask = observer(({ store }) => {
  const currentIndex = useMemo(() => {
    return store.taskHistory.findIndex((x) => x.taskId === store.task.id) + 1;
  }, [store.taskHistory]);

  const historyEnabled = store.hasInterface('topbar:prevnext');
  // @todo some interface?
  const canPostpone = isFF(FF_DEV_3034) && !store.canGoNextTask;
  const showButtons = historyEnabled || canPostpone;

  return (
    <Elem name="section">
      <Block name="current-task" mod={{ 'with-history': showButtons }}>
        <Elem name="task-id">
          {store.task.id ?? guidGenerator()}
          {historyEnabled && (
            <Elem name="task-count">
              {currentIndex} of {store.taskHistory.length}
            </Elem>
          )}
        </Elem>
        {showButtons && (
          <Elem name="history-controls">
            <Elem
              tag={Button}
              name="prevnext"
              mod={{ prev: true, disabled: !store.canGoPrevTask }}
              type="link"
              disabled={!historyEnabled || !store.canGoPrevTask}
              onClick={store.prevTask}
              style={{ background: 'none', backgroundColor: 'none' }}
            />
            <Elem
              tag={Button}
              name="prevnext"
              mod={{
                next: true,
                disabled: !store.canGoNextTask && !canPostpone,
                postpone: !store.canGoNextTask && canPostpone,
              }}
              type="link"
              disabled={!store.canGoNextTask && !canPostpone}
              onClick={store.canGoNextTask ? store.nextTask : store.postponeTask}
              style={{ background: 'none', backgroundColor: 'none' }}
            />
          </Elem>
        )}
      </Block>
    </Elem>
  );
});
