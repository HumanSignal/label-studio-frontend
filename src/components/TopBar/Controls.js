import { inject, observer } from "mobx-react";
import { Button } from "../../common/Button/Button";
import { Tooltip } from "../../common/Tooltip/Tooltip";
import { Block, Elem } from "../../utils/bem";
import { isDefined } from "../../utils/utilities";
import { IconBan } from "../../assets/icons";

import "./Controls.styl";
import { useCallback, useMemo, useState } from "react";
import { Dropdown } from "../../common/Dropdown/DropdownComponent";
import { FF_DEV_1593, isFF } from "../../utils/feature-flags";

const TOOLTIP_DELAY = 0.8;

const ButtonTooltip = inject("store")(observer(({ store, title, children }) => {
  return (
    <Tooltip
      title={title}
      enabled={store.settings.enableTooltips}
      mouseEnterDelay={TOOLTIP_DELAY}
    >
      {children}
    </Tooltip>
  );
}));

const controlsInjector = inject(({ store }) => {
  return {
    store,
    history: store?.annotationStore?.selected?.history,
  };
});

const RejectDialog = ({ disabled, store }) => {
  const [show, setShow] = useState(false);
  const [comment, setComment] = useState('');
  const onReject = useCallback(() => {
    store.rejectAnnotation({ comment: comment.length ? comment : null });
    setShow(false);
    setComment('');
  });

  return (
    <Dropdown.Trigger
      visible={show}
      toggle={() => { }}
      onToggle={(visible) => {
        setShow(visible);
      }}
      content={(
        <Block name="reject-dialog">
          <Elem name="input-title">
            Reason of Rejection
          </Elem>
          <Elem
            name='input'
            tag={'textarea'}
            type="text"
            value={comment}
            onChange={(event) => { setComment(event.target.value); }}
          />
          <Elem name='footer' >
            <Button onClick={() => setShow(false)}>Cancel</Button>
            <Button style={{ marginLeft: 8 }} look="danger" onClick={onReject}>Reject</Button>
          </Elem >
        </Block >
      )}
    >
      <Button aria-label="reject-annotation" disabled={disabled} look="danger">
        Reject
      </Button>
    </Dropdown.Trigger >
  );
};

export const Controls = controlsInjector(observer(({ store, history, annotation }) => {
  const isReview = store.hasInterface("review");
  const historySelected = isDefined(store.annotationStore.selectedHistory);
  const { userGenerate, sentUserGenerate, versions, results } = annotation;
  const buttons = [];

  const disabled = store.isSubmitting || historySelected;
  const submitDisabled = store.hasInterface("annotations:deny-empty") && results.length === 0;

  const RejectButton = useMemo(() => {
    if (isFF(FF_DEV_1593)) {
      return <RejectDialog disabled={disabled} store={store} />;
    } else {
      return (
        <ButtonTooltip key="reject" title="Reject annotation: [ Ctrl+Space ]">
          <Button aria-label="reject-annotation" disabled={disabled} look="danger" onClick={store.rejectAnnotation}>
            Reject
          </Button>
        </ButtonTooltip>
      );
    }
  }, [disabled, store]);

  if (isReview) {
    buttons.push(RejectButton);

    buttons.push(
      <ButtonTooltip key="accept" title="Accept annotation: [ Ctrl+Enter ]">
        <Button aria-label="accept-annotation" disabled={disabled} look="primary" onClick={store.acceptAnnotation}>
          {history.canUndo ? "Fix + Accept" : "Accept"}
        </Button>
      </ButtonTooltip>,
    );
  } else if (annotation.skipped) {
    buttons.push(
      <Elem name="skipped-info" key="skipped">
        <IconBan color="#d00" /> Was skipped
      </Elem>);
    buttons.push(
      <ButtonTooltip key="cancel-skip" title="Cancel skip: []">
        <Button aria-label="cancel-skip" disabled={disabled} look="primary" onClick={store.cancelSkippingTask}>
          Cancel skip
        </Button>
      </ButtonTooltip>,
    );
  } else {
    if (store.hasInterface("skip")) {
      buttons.push(
        <ButtonTooltip key="skip" title="Cancel (skip) task: [ Ctrl+Space ]">
          <Button aria-label="skip-task" disabled={disabled} look="danger" onClick={store.skipTask}>
            Skip
          </Button>
        </ButtonTooltip>,
      );
    }

    if ((userGenerate && !sentUserGenerate) || (store.explore && !userGenerate && store.hasInterface("submit"))) {
      const title = submitDisabled
        ? "Empty annotations denied in this project"
        : "Save results: [ Ctrl+Enter ]";
      // span is to display tooltip for disabled button

      buttons.push(
        <ButtonTooltip key="submit" title={title}>
          <Elem name="tooltip-wrapper">
            <Button aria-label="submit" disabled={disabled || submitDisabled} look="primary" onClick={store.submitAnnotation}>
              Submit
            </Button>
          </Elem>
        </ButtonTooltip>,
      );
    }

    if ((userGenerate && sentUserGenerate) || (!userGenerate && store.hasInterface("update"))) {
      buttons.push(
        <ButtonTooltip key="update" title="Update this task: [ Alt+Enter ]">
          <Button aria-label="submit" disabled={disabled || submitDisabled} look="primary" onClick={store.updateAnnotation}>
            {sentUserGenerate || versions.result ? "Update" : "Submit"}
          </Button>
        </ButtonTooltip>,
      );
    }
  }

  return (
    <Block name="controls">
      {buttons}
    </Block>
  );
}));
