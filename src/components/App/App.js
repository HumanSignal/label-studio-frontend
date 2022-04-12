/**
 * Libraries
 */
import React, { Component } from "react";
import { Result, Spin } from "antd";
import { getEnv, getRoot } from "mobx-state-tree";
import { observer, Provider } from "mobx-react";

/**
 * Core
 */
import Tree from "../../core/Tree";

/**
 * Components
 */
import { TopBar } from "../TopBar/TopBar";
import Debug from "../Debug";
import Segment from "../Segment/Segment";
import Settings from "../Settings/Settings";
import { RelationsOverlay } from "../RelationsOverlay/RelationsOverlay";

/**
 * Tags
 */
import "../../tags/object";
import "../../tags/control";
import "../../tags/visual";

/**
 * Styles
 */
import { TreeValidation } from "../TreeValidation/TreeValidation";
import { guidGenerator } from "../../utils/unique";
import Grid from "./Grid";
import { SidebarPage, SidebarTabs } from "../SidebarTabs/SidebarTabs";
import { AnnotationTab } from "../AnnotationTab/AnnotationTab";
import { SidePanels } from "../SidePanels/SidePanels";
import { Block, Elem } from "../../utils/bem";
import "./App.styl";
import { Space } from "../../common/Space/Space";
import { DynamicPreannotationsControl } from "../AnnotationTab/DynamicPreannotationsControl";
import { isDefined } from "../../utils/utilities";
import { FF_DEV_1170, isFF } from "../../utils/feature-flags";
import { Annotation } from "./Annotation";
import { Button } from "../../common/Button/Button";

/**
 * App
 */
class App extends Component {
  relationsRef = React.createRef();

  renderSuccess() {
    return <Result status="success" title={getEnv(this.props.store).messages.DONE} />;
  }

  renderNoAnnotation() {
    return <Result status="success" title={getEnv(this.props.store).messages.NO_COMP_LEFT} />;
  }

  renderNothingToLabel(store) {
    return (
      <Block
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          paddingBottom: "30vh",
        }}
      >
        <Result status="success" title={getEnv(this.props.store).messages.NO_NEXT_TASK} />
        <Block name="sub__result">You have completed all tasks in the queue!</Block>
        {store.canGoPrevTask && (
          <Button onClick={() => store.prevTask()} look="outlined" style={{ margin: "16px 0" }}>
            Go to Previous Task
          </Button>
        )}
      </Block>
    );
  }

  renderNoAccess() {
    return <Result status="warning" title={getEnv(this.props.store).messages.NO_ACCESS} />;
  }

  renderConfigValidationException(store) {
    return (
      <Block name="main-view">
        <Elem name="annotation">
          <TreeValidation errors={this.props.store.annotationStore.validation} />
        </Elem>
        {store.hasInterface("infobar") && <Elem name="infobar">Task #{store.task.id}</Elem>}
      </Block>
    );
  }

  renderLoader() {
    return <Result icon={<Spin size="large" />} />;
  }

  _renderAll(obj) {
    if (obj.length === 1) return <Segment annotation={obj[0]}>{[Tree.renderItem(obj[0].root)]}</Segment>;

    return (
      <div className="ls-renderall">
        {obj.map((c, i) => (
          <div key={`all-${i}`} className="ls-fade">
            <Segment annotation={c}>{[Tree.renderItem(c.root)]}</Segment>
          </div>
        ))}
      </div>
    );
  }

  _renderUI(root, as) {
    return (
      <>
        {!as.viewingAllAnnotations && !as.viewingAllPredictions && (
          <Block key={(as.selectedHistory ?? as.selected)?.id} name="main-view" onScrollCapture={this._notifyScroll}>
            <Elem name="annotation">
              {<Annotation root={root} annotation={as.selected} />}
              {this.renderRelations(as.selected)}
            </Elem>
            {getRoot(as).hasInterface("infobar") && this._renderInfobar(as)}
            {as.selected.onlyTextObjects === false && <DynamicPreannotationsControl />}
          </Block>
        )}
        {as.viewingAllAnnotations && this.renderAllAnnotations()}
        {as.viewingAllPredictions && this.renderAllPredictions()}
      </>
    );
  }

  _renderInfobar(as) {
    const { id, queue } = getRoot(as).task;

    return (
      <Elem name="infobar" tag={Space} size="small">
        <span>Task #{id}</span>

        {queue && <span>{queue}</span>}
      </Elem>
    );
  }

  renderAllAnnotations() {
    const cs = this.props.store.annotationStore;

    return <Grid store={cs} annotations={[...cs.annotations, ...cs.predictions]} root={cs.root} />;
  }

  renderAllPredictions() {
    return this._renderAll(this.props.store.annotationStore.predictions);
  }

  renderRelations(selectedStore) {
    const store = selectedStore.relationStore;
    const taskData = this.props.store.task?.data;

    return (
      <RelationsOverlay
        key={guidGenerator()}
        store={store}
        ref={this.relationsRef}
        tags={selectedStore.names}
        taskData={taskData}
      />
    );
  }

  render() {
    const { store } = this.props;
    const as = store.annotationStore;
    const root = as.selected && as.selected.root;
    const { settings } = store;

    if (store.isLoading) return this.renderLoader();

    if (store.noTask) return this.renderNothingToLabel();

    if (store.noAccess) return this.renderNoAccess();

    if (store.labeledSuccess) return this.renderSuccess();

    if (!root) return this.renderNoAnnotation();

    const viewingAll = as.viewingAllAnnotations || as.viewingAllPredictions;

    const mainContent = (
      <Block name="main-content">
        {as.validation === null
          ? this._renderUI(as.selectedHistory?.root ?? root, as)
          : this.renderConfigValidationException(store)}
      </Block>
    );

    const newUIEnabled = isFF(FF_DEV_1170);

    return (
      <Block name="editor" mod={{ fullscreen: settings.fullscreen }}>
        <Settings store={store} />
        <Provider store={store}>
          {store.showingDescription && (
            <Segment>
              <div dangerouslySetInnerHTML={{ __html: store.description }} />
            </Segment>
          )}

          {isDefined(store) && store.hasInterface("topbar") && <TopBar store={store} />}
          <Block name="wrapper" mod={{ viewAll: viewingAll, bsp: settings.bottomSidePanel || newUIEnabled }}>
            {newUIEnabled ? (
              <SidePanels panelsHidden={viewingAll} currentEntity={as.selected} regions={as.selected.regionStore}>
                {mainContent}
              </SidePanels>
            ) : (
              <>
                {mainContent}

                {viewingAll === false && (
                  <Block name="menu" mod={{ bsp: settings.bottomSidePanel }}>
                    {store.hasInterface("side-column") && (
                      <SidebarTabs active="annotation">
                        <SidebarPage name="annotation" title="Annotation">
                          <AnnotationTab store={store} />
                        </SidebarPage>

                        {this.props.panels.map(({ name, title, Component }) => (
                          <SidebarPage key={name} name={name} title={title}>
                            <Component />
                          </SidebarPage>
                        ))}
                      </SidebarTabs>
                    )}
                  </Block>
                )}
              </>
            )}
          </Block>
        </Provider>
        {store.hasInterface("debug") && <Debug store={store} />}
      </Block>
    );
  }

  _notifyScroll = () => {
    if (this.relationsRef.current) {
      this.relationsRef.current.onResize();
    }
  };
}

export default observer(App);
