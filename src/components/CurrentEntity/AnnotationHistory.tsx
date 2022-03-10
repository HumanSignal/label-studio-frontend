import { formatDistanceToNow } from "date-fns";
import { inject, observer } from "mobx-react";
import { FC, useCallback, useMemo } from "react";
import { LsSparks, LsThumbsDown, LsThumbsUp } from "../../assets/icons";
import { Space } from "../../common/Space/Space";
import { Userpic } from "../../common/Userpic/Userpic";
import { Block, Elem } from "../../utils/bem";
import { isDefined, userDisplayName } from "../../utils/utilities";
import "./AnnotationHistory.styl";

const injector = inject(({ store }) => {
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

const AnnotationHistoryComponent: FC<any> = ({
  annotationStore,
  selected,
  createdBy,
  selectedHistory,
  history,
  inline = false,
}) => {
  return (
    <Block name="annotation-history" mod={{ inline }}>
      <HistoryItem
        inline={inline}
        user={createdBy}
        extra="final state"
        entity={selected}
        onClick={() => annotationStore.selectHistory(null)}
        selected={!isDefined(selectedHistory)}
      />

      {history.length > 0 && (
        <>
          <Elem name="divider" title="History"/>
          {history.map((item: any) => {
            const { id, user, createdDate } = item;

            return (
              <HistoryItem
                key={`h-${id}`}
                inline={inline}
                user={user ?? { email: item?.createdBy }}
                date={createdDate}
                comment={item.comment}
                acceptedState={item.acceptedState}
                selected={selectedHistory?.id === item.id}
                disabled={item.results.length === 0}
                onClick={() => annotationStore.selectHistory(item)}
              />
            );
          })}
        </>
      )}
    </Block>
  );
};

const HistoryItemComponent: FC<any> = ({
  entity,
  user,
  date,
  extra,
  comment,
  acceptedState,
  selected = false,
  disabled = false,
  inline = false,
  onClick,
}) => {
  const isPrediction = entity?.type === 'prediction';

  const reason = useMemo(() => {
    switch(acceptedState) {
      case "accepted": return "Accepted";
      case "rejected": return "Rejected";
      case "fixed": return "Fixed";
      default: return null;
    }
  }, []);

  const handleClick = useCallback((e) => {
    if (disabled) return;

    onClick(e);
  }, [onClick, disabled]);

  return (
    <Block name="history-item" mod={{ inline, selected, disabled }} onClick={handleClick}>
      <Space spread>
        <Space size="small">
          <Elem
            tag={Userpic}
            user={user}
            name="userpic"
            showUsername
            username={isPrediction ? entity.createdBy : null}
            mod={{ prediction: isPrediction }}
          >{isPrediction && <LsSparks style={{ width: 16, height: 16 }}/>}</Elem>
          {isPrediction ? entity.createdBy : userDisplayName(user)}
        </Space>

        <Space size="small">
          {(acceptedState === 'accepted') ? (
            <LsThumbsUp style={{ color: '#2AA000' }}/>
          ) : acceptedState === 'fixed' ? (
            <LsThumbsUp style={{ color: '#FA8C16' }}/>
          ) : acceptedState === 'rejected' ? (
            <LsThumbsDown style={{ color: "#dd0000" }}/>
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
      {comment && (
        <Elem name="comment" data-reason={`${reason}: `}>
          {comment}
        </Elem>
      )}
    </Block>
  );
};

const HistoryItem = observer(HistoryItemComponent);

HistoryItem.displayName = 'HistoryItem';

export const AnnotationHistory = injector(observer(AnnotationHistoryComponent));

AnnotationHistory.displayName = 'AnnotationHistory';
