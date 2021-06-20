import { formatDistance, formatDistanceToNow } from "date-fns";
import { inject, observer } from "mobx-react";
import { LsSparks, LsThumbsDown, LsThumbsUp } from "../../assets/icons";
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
    selected: as?.selected,
    createdBy: selected?.user ?? { email: selected?.createdBy },
    createdDate: selected?.createdDate,
    history: as?.history,
    selectedHistory: as?.selectedHistory,
  };
});

export const AnnotationHistory = injector(observer(({
  annotationStore,
  selected,
  createdBy,
  selectedHistory,
  history
}) => {
  return (
    <Block name="annotation-history">
      <HistoryItem
        user={createdBy}
        extra="final"
        entity={selected}
        onClick={() => annotationStore.selectHistory(null)}
        selected={!isDefined(selectedHistory)}
      />

      {history.length > 0 && (
        <>
          <Elem name="divider" title="Review history"/>
          {history.map((annotation) => {
            const {id, user, createdDate} = annotation;

            return (
              <HistoryItem
                key={`h-${id}`}
                user={user ?? {email: annotation?.createdBy}}
                date={createdDate}
                acceptedState={annotation.acceptedState}
                selected={selectedHistory?.id === annotation.id}
                selectable={annotation.results.length}
                onClick={() => annotationStore.selectHistory(annotation)}
              />
            );
          })}
        </>
      )}
    </Block>
  );
}));
AnnotationHistory.displayName = 'AnnotationHistory';

const HistoryItem = observer(({entity, user, date, extra, acceptedState, selected = false, selectable = true, onClick}) => {
  const isPrediction = entity?.type === 'prediction';
  return (
    <Block name="history-item" mod={{selected, disabled: !selectable}} onClick={onClick}>
      <Space spread>
        <Space size="small">
          <Elem
            tag={Userpic}
            user={user}
            name="userpic"
            showUsername
            username={isPrediction ? entity.createdBy : null}
            mod={{prediction: isPrediction}}
          >{isPrediction && <LsSparks/>}</Elem>
          {isPrediction ? entity.createdBy : user.username}
        </Space>


        <Space size="small">
          {(acceptedState === 'accepted') ? (
            <LsThumbsUp style={{color: '#2AA000'}}/>
          ) : acceptedState === 'fixed' ? (
            <LsThumbsUp style={{color: '#FA8C16'}}/>
          ) : acceptedState === 'rejected' ? (
            <LsThumbsDown style={{color: "#dd0000"}}/>
          ) : null}

          {date ? (
            <Elem name="date">
              {formatDistanceToNow(new Date(date), { addSuffix: true })}
            </Elem>
          ) : extra ? (
            <Elem name="date">
              {extra}
            </Elem>
          ) : null}
        </Space>
      </Space>
    </Block>
  );
});
HistoryItem.displayName = 'HistoryItem';
