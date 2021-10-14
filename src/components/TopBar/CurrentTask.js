import { observer } from "mobx-react-lite";
import { Elem } from "../../utils/bem";
import { guidGenerator } from "../../utils/unique";

export const CurrentTask = observer(({ store }) => {
  return (
    <Elem name="section">
      #{store.task.id ?? guidGenerator()}
    </Elem>
  );
});
