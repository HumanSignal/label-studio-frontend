import { observer } from "mobx-react-lite";
import { Block, Elem } from "../../utils/bem";
import { guidGenerator } from "../../utils/unique";
import "./CurrentTask.styl";

export const CurrentTask = observer(({ store }) => {
  return (
    <Elem name="section">
      <Block name="current-task">
        #{store.task.id ?? guidGenerator()}
      </Block>
    </Elem>
  );
});
