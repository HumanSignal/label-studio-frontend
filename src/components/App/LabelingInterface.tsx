import {
  configValidationAtom,
  selectedAnnotationHistoryAtom,
  selectedAnnotationPropertyAtom,
  viewingAllAtom
} from '@atoms/Models/AnnotationsAtom/AnnotationsAtom';
import { useInterfaces } from '@atoms/Models/RootAtom/Hooks';
import { InstructionsAtom, RootAtom, TaskAtom } from '@atoms/Models/RootAtom/RootAtom';
import { SettingsAtom } from '@atoms/Models/SettingsAtom/SettingsAtom';
import { Result, Spin } from 'antd';
import { useAtomValue } from 'jotai';
import { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { Space } from '../../common/Space/Space';
import { Block, Elem } from '../../utils/bem';
import { Segment } from '../Segment/Segment';
import { SettingsView } from '../Settings/Settings';
import { SidePanels } from '../SidePanels/SidePanels';

/**
 * Tags
 */
import { MessagesAtom } from '@atoms/MessagesAtom';
import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { TopBar } from '@components/TopBar/TopBar';
import { ResultStatusType } from 'antd/lib/result';
import messages from '../../utils/messages';
import { AnnotationView } from './Annotation';
import './LabelingInterface.styl';

export const LabelingInterface = () => {
  const {
    fullscreen,
    bottomSidePanel,
  } = useAtomValue(SettingsAtom).settings;

  const root = useAtomValue(RootAtom);
  const selectedAnnotationAtom = useAtomValue(selectedAnnotationPropertyAtom);
  const selectedHistoryAtom = useAtomValue(selectedAnnotationHistoryAtom);
  const viewingAll = useAtomValue(viewingAllAtom);
  const instructions = useAtomValue(InstructionsAtom);
  const validation = useAtomValue(configValidationAtom);
  const currentEntity = useMemo(() => {
    return selectedHistoryAtom ?? selectedAnnotationAtom;
  }, [selectedHistoryAtom, selectedAnnotationAtom]);
  const hasInterface = useInterfaces();

  useEffect(() => {
    // Hack to activate app hotkeys
    window.blur();
    document.body.focus();
  }, []);

  if (root.isLoading) return <Result icon={<Spin size="large" />} />;

  if (root.noTask) return <NothingToLabel/>;

  if (root.noAccess) return <ResultWithMessage message='NO_ACCESS'/>;

  if (root.labeledSuccess) return <ResultWithMessage message='DONE'/>;

  return (
    <Block name="editor" mod={{ fullscreen, _auto_height: true }}>
      <SettingsView/>
      {instructions && (
        <Segment>
          <div dangerouslySetInnerHTML={{ __html: instructions }} />
        </Segment>
      )}

      {/* TODO: implement topbar */}
      {hasInterface('topbar') && (
        <TopBar annotationAtom={currentEntity}/>
      )}
      <Block name="wrapper" mod={{ viewAll: viewingAll, bsp: bottomSidePanel, outliner: true }}>
        {currentEntity ? (
          <SidePanels panelsHidden={viewingAll} currentEntity={currentEntity}>
            <Block name="main-content">
              {validation === null ? (
                <MainView
                  viewingAll={viewingAll}
                  selectedAnnotationAtom={selectedAnnotationAtom}
                  selectedHistoryAtom={selectedHistoryAtom}
                />
              ): <ConfigValidation/>}
            </Block>
          </SidePanels>
        ) : <NothingToLabel/>}
      </Block>
      {/* {store.hasInterface('debug') && <Debug store={store} />} */}
    </Block>
  );
};

type MainViewProps = {
  viewingAll: boolean,
  selectedAnnotationAtom?: AnnotationAtom,
  selectedHistoryAtom?: AnnotationAtom,
}

const MainView: FC<MainViewProps> = ({
  selectedAnnotationAtom,
  selectedHistoryAtom,
  ...props
}) => {
  if (!(selectedAnnotationAtom || selectedHistoryAtom)) return null;

  const selectedHistory = selectedHistoryAtom ? useAtomValue(selectedHistoryAtom) : null;
  const selectedAnnotation = selectedAnnotationAtom ? useAtomValue(selectedAnnotationAtom) : null;
  const selectedEntity = selectedHistory ?? selectedAnnotation;

  // TODO: support relations overlay
  const relationsRef = useRef(null);
  const hasInterface = useInterfaces();

  const notifyScroll = useCallback(() => {
    if (relationsRef.current) {
      // TODO: support the onResize on the relations overlay
      // relationsRef.current.onResize();
    }
  }, []);

  return (
    <>
      {!props.viewingAll && (
        <Block
          key={selectedEntity?.id}
          name="main-view"
          onScrollCapture={notifyScroll}
        >
          <Elem name="annotation">
            <AnnotationView
              annotationAtom={selectedAnnotationAtom}
              historyItemAtom={selectedHistoryAtom}
            />
            {/* <RelationsOverlay
              key={guidGenerator()}
              store={store}
              ref={relationsRef}
              tags={selectedStore.names}
              taskData={taskData}
            /> */}
          </Elem>
          {hasInterface('infobar') && <Infobar/>}
          {/* {selectedAnnotation.onlyTextObjects === false && (
            <DynamicPreannotationsControl />
          )} */}
        </Block>
      )}
      {/* TODO: support View All */}
      {/* {props.viewingAll && this.renderAllAnnotations()} */}
      {/* {as.viewingAllPredictions && this.renderAllPredictions()} */}
    </>
  );
};

const Infobar = () => {
  const { id, queue } = useAtomValue(TaskAtom) ?? {};

  return (
    <Elem name="infobar" tag={Space} size="small">
      <span>Task #{id}</span>

      {queue && <span>{queue}</span>}
    </Elem>
  );
};

const ConfigValidation: FC = () => {
  const { id } = useAtomValue(TaskAtom) ?? {};
  // const validation = useAtomValue(ConfigValidationAtom);
  const hasInterface = useInterfaces();

  return (
    <Block name="main-view">
      <Elem name="annotation">
        {/* <TreeValidation errors={validation} /> */}
      </Elem>
      {hasInterface('infobar') && (
        <Elem name="infobar">
          Task #{id}
        </Elem>
      )}
    </Block>
  );
};

const NothingToLabel = () => {
  return (
    <Block
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        paddingBottom: '30vh',
      }}
    >
      <ResultWithMessage status="success" message='NO_NEXT_TASK'/>
      <Block name="sub__result">You have completed all tasks in the queue!</Block>
      {/* TODO: implement go prev/next */}
      {/* {store.canGoPrevTask && (
        <Button onClick={() => store.prevTask()} look="outlined" style={{ margin: '16px 0' }}>
            Go to Previous Task
        </Button>
      )} */}
    </Block>
  );
};

const ResultWithMessage: FC<{
  message: keyof typeof messages,
  status?: ResultStatusType,
}> = ({
  message,
  status = 'warning',
}) => {
  const messages = useAtomValue(MessagesAtom);

  return (
    <Result
      status={status}
      title={messages[message] as string}
    />
  );
};
