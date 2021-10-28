import { observer } from "mobx-react-lite";
import { getEnv } from "mobx-state-tree";
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

  return (
    <Elem name="section">
      <Block name="current-task">
        <Button
          onClick={nextTask}
        >
          Next
        </Button>
        <Button
          onClick={prevTask}
        >
          Prev
        </Button>
        #{store.task.id ?? guidGenerator()}
      </Block>
    </Elem>
  );
});
