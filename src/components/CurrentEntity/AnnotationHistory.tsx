import { formatDistanceToNow } from "date-fns";
import { inject, observer } from "mobx-react";
import { FC, useCallback, useMemo } from "react";
import { IconDraftCreated, IconEntityCreated, IconThumbsDown, IconThumbsUp, LsSparks } from "../../assets/icons";
import { Space } from "../../common/Space/Space";
import { Userpic } from "../../common/Userpic/Userpic";
import { Block, Elem } from "../../utils/bem";
import { isDefined, userDisplayName } from "../../utils/utilities";
import "./AnnotationHistory.styl";

type HistoryItemType =   'import' | 'submit' | 'update' | 'accepted' | 'rejected' | 'fixed_and_accepted';

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
  selectedHistory,
  history,
  inline = false,
}) => {
  return (
    <Block name="annotation-history" mod={{ inline }}>
      {history.length > 0 && history.map((item: any) => {
        const { id, user, createdDate } = item;

        const selected = selectedHistory?.id === item.id;

        return (
          <HistoryItem
            key={`h-${id}`}
            inline={inline}
            user={user ?? { email: item?.createdBy }}
            date={createdDate}
            comment={item.comment}
            acceptedState={item.actionType}
            selected={selected}
            disabled={item.results.length === 0}
            onClick={() => {
              annotationStore.selectHistory(selected ? null : item);
            }}
          />
        );
      })}
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
      case "fixed_and_accepted": return "Fixed";
      case "update": return "Updated";
      case "submit": return "Submitted";
      case "draft-created": return "Created a draft";
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
          <Elem name="name" tag="span">
            {isPrediction ? entity.createdBy : userDisplayName(user)}
          </Elem>
        </Space>

        <Space size="small">

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
      {reason && (
        <Elem name="action" tag={Space} size="small">
          <HistoryIcon type={acceptedState}/>
          <Elem name="comment" data-reason={`${reason}${comment ? ': ' : ''}`}>
            {comment}
          </Elem>
        </Elem>
      )}
    </Block>
  );
};


const HistoryIcon: FC<{type: HistoryItemType}> = ({ type }) => {
  const icon = useMemo(() => {
    switch(type) {
      case 'submit': return <IconEntityCreated style={{ color: "#0099FF" }}/>;
      case 'update': return <IconEntityCreated style={{ color: "#0099FF" }}/>;
      // case 'draft-created': return <IconDraftCreated style={{ color: "#0099FF" }}/>;
      case 'accepted': return <IconThumbsUp style={{ color: '#2AA000' }}/>;
      case 'rejected': return <IconThumbsDown style={{ color: "#dd0000" }}/>;
      case 'fixed_and_accepted': return <IconThumbsUp style={{ color: '#FA8C16' }}/>;
      default: return null;
    }
  }, [type]);

  return icon && (
    <Elem name="history-icon">{icon}</Elem>
  );
};

const HistoryItem = observer(HistoryItemComponent);

HistoryItem.displayName = 'HistoryItem';

export const AnnotationHistory = injector(observer(AnnotationHistoryComponent));

AnnotationHistory.displayName = 'AnnotationHistory';
