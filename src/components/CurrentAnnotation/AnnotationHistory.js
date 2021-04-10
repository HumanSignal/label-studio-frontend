import { formatDistance, formatDistanceToNow } from "date-fns";
import { inject, observer } from "mobx-react";
import { Space } from "../../common/Space/Space";
import { Userpic } from "../../common/Userpic/Userpic";
import { Block, Elem } from "../../utils/bem";
import "./AnnotationHistory.styl";

const injector = inject(({store}) => {
  const selected = store.annotationStore?.selected;
  return {
    createdBy: selected?.user ?? { email: selected?.createdBy },
    createdDate: selected?.createdDate,
  };
});

export const AnnotationHistory = injector(({
  createdBy,
  createdDate
}) => {
  return (
    <Block name="annotation-history">
      <HistoryItem user={createdBy} date={createdDate}/>
    </Block>
  );
});

const HistoryItem = observer(({user, date}) => {
  return (
    <Block name="history-item">
      <Space spread>
        <Space size="small">
          <Userpic user={user}/>
          {user.username}
        </Space>

        {date ? (
          <Elem name="date">
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </Elem>
        ) : null}
      </Space>
    </Block>
  );
});
