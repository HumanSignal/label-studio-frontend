import { IconBan } from '../../../assets/icons';
import { Block, Elem } from '../../../utils/bem';

import { useAtomValue } from 'jotai';
import { FC, useCallback, useMemo, useState } from 'react';
import { Annotation, AnnotationAtom } from 'src/Engine/Atoms/Models/AnnotationsAtom/Types';
import { useInterfaces } from 'src/Engine/Atoms/Models/RootAtom/Hooks';
import { RootAtom } from 'src/Engine/Atoms/Models/RootAtom/RootAtom';
import { SubmitAtom } from 'src/Engine/Atoms/Models/SubmitAtom';
import { SubmitButton } from './GenericSubmitButton';
import './SubmissionControls.styl';

type SubmissionControlsProps = {
  selectedAnnotationAtom: AnnotationAtom,
}

export const SubmissionControls: FC<SubmissionControlsProps> = ({
  selectedAnnotationAtom,
}) => {
  const history = {
    canUndo: false,
  };
  const hasInterface = useInterfaces();
  const { explore } = useAtomValue(RootAtom);
  const isReview = hasInterface('review');
  const annotation = useAtomValue(selectedAnnotationAtom);
  const submission = useAtomValue(SubmitAtom);

  const historySelected = useMemo(() => {
    return annotation.type === 'history';
  }, [annotation.type]);

  const { userCreated, saved, editable: annotationEditable } = annotation;

  const versions: unknown[] = [];
  const results: unknown[] = [];

  const buttonControl = useButtonControl();

  // const isReady = store.annotationStore.selected.objects.every(object => object.isReady === undefined || object.isReady);
  const disabled = !annotationEditable || submission.sbumitting || historySelected || buttonControl.isInProgress; // || !isReady;
  const submitDisabled = hasInterface('annotations:deny-empty') && results.length === 0;

  return (
    <Block name="controls">
      {isReview ? (
        <ReviewButtons
          disabled={disabled}
          history={history}
          buttonControl={buttonControl}
        />
      ) : annotation.skipped ? (
        <SkipControls
          disabled={disabled}
        />
      ) : (
        <DefaultControls
          disabled={disabled}
          userGenerate={userCreated}
          sentUserGenerate={saved}
          explore={explore}
          submitDisabled={submitDisabled}
          versions={versions}
          buttonControl={buttonControl}
        />
      )}
    </Block>
  );
};

const DefaultControls: FC<{
  disabled: boolean,
  userGenerate: boolean,
  sentUserGenerate: boolean,
  explore: boolean,
  submitDisabled: boolean,
  versions: Annotation['versions'],
  buttonControl: ReturnType<typeof useButtonControl>,
}> = ({
  disabled,
  userGenerate,
  sentUserGenerate,
  submitDisabled,
  explore,
  versions,
  buttonControl,
}) => {
  const store = null;
  const hasInterface = useInterfaces();
  const showSkipButton = hasInterface('skip');

  const showDefaultSubmitButton = useMemo(() => {
    return (userGenerate && !sentUserGenerate) || (explore && !userGenerate && hasInterface('submit'));
  }, [userGenerate, sentUserGenerate, explore, hasInterface]);

  const showUpdateSubmitButton = useMemo(() => {
    return (userGenerate && sentUserGenerate) || (!userGenerate && hasInterface('update'));
  }, [userGenerate, sentUserGenerate, hasInterface]);

  const submitButtonTitle = useMemo(() => {
    return submitDisabled
      ? 'Empty annotations denied in this project'
      : 'Save results: [ Ctrl+Enter ]';
  }, [submitDisabled]);

  const updateDisabled = useMemo(() => {
    return disabled || submitDisabled;
  }, [disabled, submitDisabled]);

  const updateButtonTitle = useMemo(() => {
    return sentUserGenerate || versions.result ? 'Update' : 'Submit';
  }, [sentUserGenerate, versions.result]);

  return (
    <>
      {showSkipButton && (
        <SubmitButton
          title='Skip'
          tooltip="Cancel (skip) task: [ Ctrl+Space ]"
          disabled={disabled}
          look="danger"
          ariaLabel="skip-task"
          onClick={async () => {
            if (hasInterface('comments:skip') ?? true) {
              buttonControl.handler(e, () => store.skipTask({}), 'Please enter a comment before skipping');
            } else {
              await store.commentStore.commentFormSubmit();
              store.skipTask({});
            }
          }}
        />
      )}

      {showDefaultSubmitButton && (
        <SubmitButton
          title='Submit'
          tooltip={submitButtonTitle}
          disabled={updateDisabled}
          look="primary"
          ariaLabel="submit-task"
          onClick={async () => {
            await store.commentStore.commentFormSubmit();
            store.submitAnnotation();
          }}
        />
      )}

      {showUpdateSubmitButton && (
        <SubmitButton
          title={updateButtonTitle}
          ariaLabel="update-task"
          look="primary"
          tooltip="Update this task: [ Alt+Enter ]"
          disabled={updateDisabled}
          onClick={async () => {
            await store.commentStore.commentFormSubmit();
            store.updateAnnotation();
          }}
        />
      )}
    </>
  );
};

const ReviewButtons: FC<{
  history: any,
  disabled: boolean,
  buttonControl: ReturnType<typeof useButtonControl>,
}> = ({
  history,
  disabled,
  buttonControl,
}) => {
  const store = null;
  const hasInterface = useInterfaces();

  return (
    <>
      <SubmitButton
        title='Reject'
        tooltip="Reject annotation: [ Ctrl+Space ]"
        disabled={disabled}
        ariaLabel="accept-annotation"
        onClick={async () => {
          if (hasInterface('comments:reject') ?? true) {
            buttonControl.handler(e, () => store.rejectAnnotation({}), 'Please enter a comment before rejecting');
          } else {
            await store.commentStore.commentFormSubmit();
            store.rejectAnnotation({});
          }
        }}
      />
      <SubmitButton
        title={history.canUndo ? 'Fix + Accept' : 'Accept'}
        tooltip="Accept annotation: [ Ctrl+Enter ]"
        disabled={disabled}
        primary
        ariaLabel="accept-annotation"
        onClick={async () => {
          await store.commentStore.commentFormSubmit();
          store.acceptAnnotation();
        }}
      />
    </>
  );
};

const SkipControls: FC<{
  disabled: boolean,
}> = ({
  disabled,
}) => {
  const store = null;

  return (
    <>
      <Elem name="skipped-info" key="skipped">
        <IconBan color="#d00" /> Was skipped
      </Elem>
      <SubmitButton
        title='Skip'
        tooltip="Cancel skip"
        disabled={disabled}
        ariaLabel="cancel-skip"
        onClick={async () => {
          await store.commentStore.commentFormSubmit();
          store.unskipTask();
        }}
      />
    </>
  );
};

const useButtonControl = () => {
  const store = null;
  const [isInProgress, setIsInProgress] = useState(false);

  const handler = useCallback(async (e, callback, tooltipMessage) => {
    const { addedCommentThisSession, currentComment, commentFormSubmit, inputRef } = store.commentStore;

    if (isInProgress) return;
    setIsInProgress(true);
    if (!inputRef.current || addedCommentThisSession) {
      callback();
    } else if ((currentComment ?? '').trim()) {
      e.preventDefault();
      await commentFormSubmit();
      callback();
    } else {
      const commentsInput = inputRef.current;

      store.commentStore.setTooltipMessage(tooltipMessage);
      commentsInput.scrollIntoView({
        behavior: 'smooth',
      });
      commentsInput.focus({ preventScroll: true });
    }
    setIsInProgress(false);
  }, [
    store?.commentStore?.currentComment,
    store?.commentStore?.inputRef,
    store?.commentStore?.commentFormSubmit,
    store?.commentStore?.addedCommentThisSession,
    isInProgress,
  ]);

  return {
    handler,
    isInProgress,
  };
};
