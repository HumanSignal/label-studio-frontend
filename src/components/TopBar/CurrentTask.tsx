import { useInterfaces } from '@atoms/Models/RootAtom/Hooks';
import { TaskAtom, TaskHistoryControlAtom } from '@atoms/Models/RootAtom/RootAtom';
import { useAtomValue } from 'jotai';
import { FC, useCallback, useMemo } from 'react';
import { Button } from '../../common/Button/Button';
import { Block, Elem } from '../../utils/bem';
import { FF_DEV_3034, isFF } from '../../utils/feature-flags';
import { guidGenerator } from '../../utils/unique';
import { isDefined } from '../../utils/utilities';
import './CurrentTask.styl';

type CurrentTaskProps = {
  selectedEntityId?: string,
}

export const CurrentTask: FC<CurrentTaskProps> = ({ selectedEntityId }) => {
  const hasInterface = useInterfaces();
  const task = useAtomValue(TaskAtom);
  const taskHistory = useAtomValue(TaskHistoryControlAtom);

  const currentIndex = useMemo(() => {
    if (!task) return -1;
    return taskHistory.history.findIndex((x) => x.taskId === task.id) + 1;
  }, [taskHistory.history, task?.id]);

  const historyEnabled = hasInterface('topbar:prevnext');

  const [canGoNext, canGoPrev] = [taskHistory.canGoNext(), taskHistory.canGoPrev()];

  const goNext = useCallback(() => {
    console.log('goNext');
  }, []);

  const goPrev = useCallback(() => {
    console.log('goPrev');
  }, []);

  const postpone = useCallback(() => {
    console.log('postpone');
  }, []);

  // @todo some interface?
  const canPostpone = isFF(FF_DEV_3034)
    && !isDefined(selectedEntityId)
    && !canGoNext
    && !hasInterface('review')
    && hasInterface('postpone');

  return (
    <Elem name="section">
      <Block name="current-task" mod={{ 'with-history': historyEnabled }}>
        <Elem name="task-id">
          {task?.id ?? guidGenerator()}
          {historyEnabled && (
            <Elem name="task-count">
              {currentIndex} of {taskHistory.history.length}
            </Elem>
          )}
        </Elem>
        {historyEnabled && (
          <Elem name="history-controls">
            <Elem
              tag={Button}
              name="prevnext"
              mod={{ prev: true, disabled: !canGoNext }}
              type="link"
              disabled={!historyEnabled || !canGoPrev}
              onClick={goPrev}
              style={{ background: 'none', backgroundColor: 'none' }}
            />
            <Elem
              tag={Button}
              name="prevnext"
              mod={{
                next: true,
                disabled: !canGoNext && !canPostpone,
                postpone: !canGoNext && canPostpone,
              }}
              type="link"
              disabled={!canGoNext && !canPostpone}
              onClick={canGoNext ? goNext : postpone}
              style={{ background: 'none', backgroundColor: 'none' }}
            />
          </Elem>
        )}
      </Block>
    </Elem>
  );
};
