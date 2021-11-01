import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Button } from "../../common/Button/Button";
import { Block, Elem } from "../../utils/bem";
import { guidGenerator } from "../../utils/unique";
import "./CurrentTask.styl";


export const CurrentTask = observer(({ store }) => {

  const nextTask = () => {
    store.nextTask();
  };


  const prevTask = () => {
    store.prevTask();
  };

  const currentIndex = useMemo(() => {
    return store.taskHistory.findIndex((x) => x.taskId === store.task.id) + 1;
  }, [store.taskHistory]);

  const historyEnabled = store.hasInterface('topbar:prevnext');

  return (
    <Elem name="section">
      <Block name="current-task" mod={{ 'with-history': historyEnabled }}>
        <Elem name="task-id">
          {store.task.id ?? guidGenerator()}
          {historyEnabled && (
            <Elem name="task-count">
              {currentIndex} of {store.taskHistory.length}
            </Elem>
          )}
        </Elem>
        {historyEnabled && (
          <Elem name="history-controls">
            <Elem
              tag={Button}
              name="prevnext"
              mod={{ prev: true, disabled: !store.canGoPrevTask }}
              type="link"
              disabled={!store.canGoPrevTask}
              onClick={prevTask}
              style={{ background: 'none', backgroundColor: 'none' }}
            />
            <Elem
              tag={Button}
              name="prevnext"
              mod={{ next: true, disabled: !store.canGoNextTask }}
              type="link"
              disabled={!store.canGoNextTask}
              onClick={nextTask}
              style={{ background: 'none', backgroundColor: 'none' }}
            />
          </Elem>
        )}
      </Block>
    </Elem>
  );
});
