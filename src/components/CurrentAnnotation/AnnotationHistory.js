import { formatDistance, formatDistanceToNow } from "date-fns";
import { inject, observer } from "mobx-react";
import { Space } from "../../common/Space/Space";
import { Userpic } from "../../common/Userpic/Userpic";
import { Block, Elem } from "../../utils/bem";
import { isDefined } from "../../utils/utilities";
import "./AnnotationHistory.styl";

const injector = inject(({store}) => {
  const as = store.annotationStore;
  const selected = as?.selected;
  return {
    annotationStore: as,
    createdBy: selected?.user ?? { email: selected?.createdBy },
    createdDate: selected?.createdDate,
    history: as?.history,
    selectedHistory: as?.selectedHistory,
  };
});

export const AnnotationHistory = injector(observer(({
  annotationStore,
  createdBy,
  createdDate,
  selectedHistory,
  history
}) => {
  return (
    <Block name="annotation-history">
      <HistoryItem
        user={createdBy}
        date={createdDate}
        onClick={() => annotationStore.selectHistory(null)}
        selected={!isDefined(selectedHistory)}
      />

      {history.filter(anno => anno.results.length).map((annotation) => {
        const {id, user, createdDate} = annotation;

        return (
          <HistoryItem
            key={`h-${id}`}
            user={user}
            date={createdDate}
            selected={selectedHistory?.id === annotation.id}
            selectable={annotation.results.length}
            onClick={() => annotationStore.selectHistory(annotation)}
          />
        );
      })}
    </Block>
  );
}));

const HistoryItem = observer(({user, date, selected = false, selectable = true, onClick}) => {
  return (
    <Block name="history-item" mod={{selected, disabled: !selectable}} onClick={onClick}>
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
