import { inject, observer } from "mobx-react";
import { Button } from "../../common/Button/Button";
import { Tooltip } from "../../common/Tooltip/Tooltip";
import { Block, Elem } from "../../utils/bem";
import { isDefined } from "../../utils/utilities";
import "./Controls.styl";
import { IconBan } from "../../assets/icons";

const TOOLTIP_DELAY = 0.8;

const ButtonTooltip = inject("store")(observer(({store, title, children}) => {
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

export const Controls = inject("store")(observer(({store, annotation}) => {
  const isReview = store.hasInterface("review");
  const historySelected = isDefined(store.annotationStore.selectedHistory);
  const { userGenerate, sentUserGenerate, versions, results } = annotation;
  const buttons = [];

  const disabled = store.isSubmitting || historySelected;
  const submitDisabled = store.hasInterface("annotations:deny-empty") && results.length === 0;

  if (isReview) {
    buttons.push(
      <ButtonTooltip key="reject" title="Reject annotation: [ Ctrl+Space ]">
        <Button disabled={disabled} look="danger" onClick={store.rejectAnnotation}>
          Reject
        </Button>
      </ButtonTooltip>
    );

    buttons.push(
      <ButtonTooltip key="accept" title="Accept annotation: [ Ctrl+Enter ]">
        <Button disabled={disabled} look="primary" onClick={store.acceptAnnotation}>
          {history.canUndo ? "Fix + Accept" : "Accept"}
        </Button>
      </ButtonTooltip>
    );
  } else if (annotation.skipped) {
    buttons.push(
      <Elem name="skipped-info" key="skipped">
        <IconBan color="#d00" /> Annotation skipped
      </Elem>
    );
  } else {
    if (store.hasInterface("skip")) {
      buttons.push(
        <ButtonTooltip key="skip" title="Cancel (skip) task: [ Ctrl+Space ]">
          <Button disabled={disabled} look="danger" onClick={store.skipTask}>
            Skip
          </Button>
        </ButtonTooltip>
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
            <Button disabled={disabled || submitDisabled} look="primary" onClick={store.submitAnnotation}>
              Submit
            </Button>
          </Elem>
        </ButtonTooltip>
      );
    }

    if ((userGenerate && sentUserGenerate) || (!userGenerate && store.hasInterface("update"))) {
      buttons.push(
        <ButtonTooltip key="update" title="Update this task: [ Alt+Enter ]">
          <Button disabled={disabled || submitDisabled} look="primary" onClick={store.updateAnnotation}>
            {sentUserGenerate || versions.result ? "Update" : "Submit"}
          </Button>
        </ButtonTooltip>
      );
    }
  }

  return (
    <Block name="controls">
      {buttons}
    </Block>
  );
}));
