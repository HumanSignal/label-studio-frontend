import { inject, observer } from 'mobx-react';
import { Button } from '../../common/Button/Button';
import { Tooltip } from '../../common/Tooltip/Tooltip';
import { Block, Elem } from '../../utils/bem';
import { isDefined } from '../../utils/utilities';
import { IconBan } from '../../assets/icons';
import { FF_PROD_E_111, isFF } from '../../utils/feature-flags';
import './Controls.styl';
import { useCallback, useMemo, useState } from 'react';
import { LsChevron } from '../../assets/icons';
import { Dropdown } from '../../common/Dropdown/DropdownComponent';

const TOOLTIP_DELAY = 0.8;

const ButtonTooltip = inject('store')(observer(({ store, title, children }) => {
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

export const Controls = controlsInjector(observer(({ store, history, annotation }) => {
  const isReview = store.hasInterface('review');
  const isNotQuickView = store.hasInterface('topbar:prevnext');
  const historySelected = isDefined(store.annotationStore.selectedHistory);
  const { userGenerate, sentUserGenerate, versions, results, editable: annotationEditable } = annotation;
  const buttons = [];

  const [isInProgress, setIsInProgress] = useState(false);

  const disabled = !annotationEditable || store.isSubmitting || historySelected || isInProgress;
  const submitDisabled = store.hasInterface('annotations:deny-empty') && results.length === 0;
  
  const buttonHandler = useCallback(async (e, callback, tooltipMessage) => {
    const { addedCommentThisSession, currentComment, commentFormSubmit } = store.commentStore;
    
    if (isInProgress) return;
    setIsInProgress(true);
    if(addedCommentThisSession){
      callback();
    } else if((currentComment ?? '').trim()) {
      e.preventDefault();
      await commentFormSubmit();
      callback();
    } else {
      store.commentStore.setTooltipMessage(tooltipMessage);
    }
    setIsInProgress(false);
  }, [
    store.rejectAnnotation, 
    store.skipTask, 
    store.commentStore.currentComment, 
    store.commentStore.commentFormSubmit, 
    store.commentStore.addedCommentThisSession,
    isInProgress,
  ]);

  const RejectButton = useMemo(() => {
    return (
      <ButtonTooltip key="reject" title="Reject annotation: [ Ctrl+Space ]">
        <Button aria-label="reject-annotation" disabled={disabled} onClick={async (e)=> {
          if(store.hasInterface('comments:reject') ?? true) {
            buttonHandler(e, () => store.rejectAnnotation({}), 'Please enter a comment before rejecting');
          } else {
            console.log('rejecting');
            await store.commentStore.commentFormSubmit();
            store.rejectAnnotation({});
          }
        }}>
          Reject
        </Button>
      </ButtonTooltip>
    );
  }, [disabled, store]);

  if (isReview) {
    buttons.push(RejectButton);

    buttons.push(
      <ButtonTooltip key="accept" title="Accept annotation: [ Ctrl+Enter ]">
        <Button aria-label="accept-annotation" disabled={disabled} look="primary" onClick={async () => {
          await store.commentStore.commentFormSubmit();
          store.acceptAnnotation();
        }}>
          {history.canUndo ? 'Fix + Accept' : 'Accept'}
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
        <Button aria-label="cancel-skip" disabled={disabled} look="primary" onClick={async () => {
          await store.commentStore.commentFormSubmit();
          store.unskipTask();
        }}>
          Cancel skip
        </Button>
      </ButtonTooltip>,
    );
  } else {
    if (store.hasInterface('skip')) {
      buttons.push(
        <ButtonTooltip key="skip" title="Cancel (skip) task: [ Ctrl+Space ]">
          <Button aria-label="skip-task" disabled={disabled} onClick={async (e)=> {
            if(store.hasInterface('comments:skip') ?? true) {
              buttonHandler(e, () => store.skipTask({}), 'Please enter a comment before skipping');
            } else {
              await store.commentStore.commentFormSubmit();
              store.skipTask({});
            }
          }}>
            Skip
          </Button>
        </ButtonTooltip>,
      );
    }

    const look = (disabled || submitDisabled) ? 'disabled' : 'primary';


    
    if (isFF(FF_PROD_E_111)) {
      const SubmitOption = ({ isUpdate, onClickMethod }) => {
        return (
          <Button
            name="list-button"
            look="secondary"
            onClick={async (event) => {
              event.preventDefault();
              
              if ('URLSearchParams' in window) {
                const searchParams = new URLSearchParams(window.location.search);

                searchParams.set('exitStream', 'true');
                const newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();

                window.history.pushState(null, '', newRelativePathQuery);
              }
              await store.commentStore.commentFormSubmit();
              onClickMethod();
            }}
          >
            {`${isUpdate ? 'Update' : 'Submit'} and exit`}
          </Button>
        );
      };
      const createButton = (key, title, onClickMethod, isUpdate = false) => {
        return (
          <ButtonTooltip key={key} title={title}>
            <Elem name="tooltip-wrapper">
              <Button
                aria-label="submit"
                name="submit"
                mod={{ has_icon: !isNotQuickView }}
                disabled={disabled || submitDisabled}
                look={look}
                icon={isNotQuickView &&(
                  <Dropdown.Trigger
                    content={<SubmitOption onClickMethod={onClickMethod} isUpdate={isUpdate} />}
                  >
                    <div>
                      <LsChevron />
                    </div>
                  </Dropdown.Trigger>
                )}
                onClick={async (event) => {
                  if (event.target.classList.contains('lsf-dropdown__trigger')) return;
                  await store.commentStore.commentFormSubmit();
                  onClickMethod();
                }}
              >
                {isUpdate ? 'Update' : 'Submit'}
              </Button>
            </Elem>
          </ButtonTooltip>
        );
      };
      
      const conditions = [
        {
          check: (userGenerate) || (store.explore && !userGenerate && store.hasInterface('submit')),
          key: 'submit',
          title: submitDisabled ? 'Empty annotations denied in this project' : 'Save results: [ Ctrl+Enter ]',
          method: store.submitAnnotation,
        },
        {
          check: (userGenerate && sentUserGenerate) || (!userGenerate && store.hasInterface('update')),
          key: 'update',
          title: 'Update this task: [ Alt+Enter ]',
          method: store.updateAnnotation,
          isUpdate: sentUserGenerate || versions.result,
        },
      ];
      
      conditions.forEach((condition) => {
        if (condition.check) {
          buttons.push(createButton(condition.key, condition.title, condition.method, condition.isUpdate));
        }
      });
      

    } else {
      if ((userGenerate) || (store.explore && !userGenerate && store.hasInterface('submit'))) {
        const title = submitDisabled
          ? 'Empty annotations denied in this project'
          : 'Save results: [ Ctrl+Enter ]';
  
        buttons.push(
          <ButtonTooltip key="submit" title={title}>
            <Elem name="tooltip-wrapper">
              <Button aria-label="submit" disabled={disabled || submitDisabled} look={look} onClick={async () => {
                await store.commentStore.commentFormSubmit();
                store.submitAnnotation();
              }}>
                Submit
              </Button>
            </Elem>
          </ButtonTooltip>,
        );
      }
  
      if ((userGenerate && sentUserGenerate) || (!userGenerate && store.hasInterface('update'))) {
        const isUpdate = sentUserGenerate || versions.result;
        const button = (
          <ButtonTooltip key="update" title="Update this task: [ Alt+Enter ]">
            <Button aria-label="submit" disabled={disabled || submitDisabled} look={look} onClick={async () => {
              await store.commentStore.commentFormSubmit();
              store.updateAnnotation();
            }}>
              {isUpdate ? 'Update' : 'Submit'}
            </Button>
          </ButtonTooltip>
        );
  
        buttons.push(button);
      }  
    }
  }

  return (
    <Block name="controls">
      {buttons}
    </Block>
  );
}));
