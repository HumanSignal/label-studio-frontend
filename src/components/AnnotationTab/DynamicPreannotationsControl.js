import { inject, observer } from "mobx-react";
import Input from "../../common/Input/Input";
import { Block } from "../../utils/bem";
import "./DynamicPreannotationsControl.styl";

export const DynamicPreannotationsControl = inject("store")(observer(({ store }) => {
  return store.dynamicPreannotations ? (
    <Block name="dynamic-preannotations-control">
      {store.awaitingSuggestions && (
        <div>loading...</div>
      )}
      <Input
        type="checkbox"
        checked={store.autoAcceptSuggestions}
        label="Auto accept annotation suggestions"
        onChange={(e) => store.setAutoAcceptSuggestions(e.target.checked)}
        labelProps={{
          placement: 'right',
        }}
      />
    </Block>
  ) : null;
}));
