import { formatDistanceToNow } from "date-fns";
import { inject, observer } from "mobx-react";
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  IconAnnotationAccepted,
  IconAnnotationImported,
  IconAnnotationPrediction,
  IconAnnotationRejected,
  IconAnnotationSkipped,
  IconAnnotationSubmitted,
  IconDraftCreated,
  LsSparks
} from "../../assets/icons";
import { Space } from "../../common/Space/Space";
import { Userpic } from "../../common/Userpic/Userpic";
import { Block, Elem } from "../../utils/bem";
import { userDisplayName } from "../../utils/utilities";
import "./AnnotationHistory.styl";

type HistoryItemType = (
  'prediction' |
  'imported' |
  'submitted' |
  'updated' |
  'skipped' |
  'accepted' |
  'rejected' |
  'fixed_and_accepted' |
  'draft_created'
);

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
      <Elem name="title">Annotation History</Elem>

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

const HistoryItemComponent: FC<{
  entity?: any,
  user: any,
  date: string | number,
  extra?: any,
  comment: string,
  acceptedState: HistoryItemType,
  selected?: boolean,
  disabled?: boolean,
  inline?: boolean,
  onClick: any,
}> = ({
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
      case "updated": return "Updated";
      case "submitted": return "Submitted";
      case 'prediction': return "From prediction";
      case 'imported': return "Imported";
      case 'skipped': return "Skipped";
      case "draft_created": return "Created a draft";
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
      {(reason || comment) && (
        <Elem name="action" tag={Space} size="small">
          {acceptedState && <HistoryIcon type={acceptedState}/>}
          <HistoryComment comment={comment} reason={reason}/>
        </Elem>
      )}
    </Block>
  );
};

const HistoryComment: FC<{
  reason: string | null,
  comment: string,
}> = ({ reason, comment }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsible, setCollapsible] = useState(false);
  const commentRef = useRef();

  useLayoutEffect(() => {
    if (commentRef.current) {
      const { clientHeight } = commentRef.current;
      // 3 lines of text 22px height each
      const heightExceeded = clientHeight > 66;

      setCollapsible(heightExceeded);
      setCollapsed(heightExceeded);
    }
  }, []);

  return (
    <Elem
      name="comment"
      ref={commentRef}
      mod={{ collapsed }}
    >
      <Elem name="comment-content" data-reason={`${reason}${comment ? ': ' : ''}`}>
        {comment}
      </Elem>

      {collapsible && (
        <Elem name="collapse-comment" mod={{ collapsed }} onClick={(e: MouseEvent) => {
          e.stopPropagation();
          setCollapsed((v) => !v);
        }}>
          {collapsed ? "Show more" : "Show less"}
        </Elem>
      )}
    </Elem>
  );
};

const HistoryIcon: FC<{type: HistoryItemType}> = ({ type }) => {
  const icon = useMemo(() => {
    switch(type) {
      case 'submitted': return <IconAnnotationSubmitted style={{ color: "#0099FF" }}/>;
      case 'updated': return <IconAnnotationSubmitted style={{ color: "#0099FF" }}/>;
      case 'draft_created': return <IconDraftCreated style={{ color: "#0099FF" }}/>;
      case 'accepted': return <IconAnnotationAccepted style={{ color: '#2AA000' }}/>;
      case 'rejected': return <IconAnnotationRejected style={{ color: "#dd0000" }}/>;
      case 'fixed_and_accepted': return <IconAnnotationAccepted style={{ color: '#FA8C16' }}/>;
      case 'prediction': return <IconAnnotationPrediction style={{ color: '#944BFF' }}/>;
      case 'imported': return <IconAnnotationImported style={{ color: '#2AA000' }}/>;
      case 'skipped': return <IconAnnotationSkipped style={{ color: '#dd0000' }}/>;
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
