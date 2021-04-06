/**
 * Libraries
 */
import React, { Component } from "react";
import { Result, Spin } from "antd";
import { getEnv } from "mobx-state-tree";
import { observer, Provider } from "mobx-react";

/**
 * Core
 */
import Tree from "../../core/Tree";

/**
 * Components
 */
import Debug from "../Debug";
import Segment from "../Segment/Segment";
import Settings from "../Settings/Settings";
import { RelationsOverlay } from "../RelationsOverlay/RelationsOverlay";

/**
 * Tags
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as ObjectTags from "../../tags/object"; // eslint-disable-line no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as ControlTags from "../../tags/control"; // eslint-disable-line no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as VisualTags from "../../tags/visual"; // eslint-disable-line no-unused-vars

/**
 * Styles
 */
import styles from "./App.module.scss";
import { TreeValidation } from "../TreeValidation/TreeValidation";
import { guidGenerator } from "../../utils/unique";
import Grid from "./Grid";
import { AnnotationTabs } from "../AnnotationTabs/AnnotatioTabs";
import { SidebarPage, SidebarToggle } from "../SidebarToggle/SidebarToggle";
import { AnnotationTab } from "../AnnotationTab/AnnotationTab";

/**
 * App
 */
class App extends Component {
  renderSuccess() {
    return <Result status="success" title={getEnv(this.props.store).messages.DONE} />;
  }

  renderNoAnnotation() {
    return <Result status="success" title={getEnv(this.props.store).messages.NO_COMP_LEFT} />;
  }

  renderNothingToLabel() {
    return <Result status="success" title={getEnv(this.props.store).messages.NO_NEXT_TASK} />;
  }

  renderNoAccess() {
    return <Result status="warning" title={getEnv(this.props.store).messages.NO_ACCESS} />;
  }

  renderConfigValidationException() {
    return (
      <Segment>
        <TreeValidation errors={this.props.store.annotationStore.validation} />
      </Segment>
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

  _renderUI(root, store, cs) {
    return (
      <>
        {!cs.viewingAllAnnotations && !cs.viewingAllPredictions && (
          <div style={{ position: "relative" }}>
            {Tree.renderItem(root)}
            {this.renderRelations(cs.selected)}
          </div>
        )}
        {cs.viewingAllAnnotations && this.renderAllAnnotations()}
        {cs.viewingAllPredictions && this.renderAllPredictions()}
      </>
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
    return <RelationsOverlay key={guidGenerator()} store={store} />;
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

    const stEditor = settings.fullscreen ? styles.editorfs : styles.editor;
    const stCommon = settings.bottomSidePanel ? styles.commonbsp : styles.common;
    const stMenu = settings.bottomSidePanel ? styles.menubsp : styles.menu;

    return (
      <div className={stEditor + " ls-editor"}>
        <Settings store={store} />
        <Provider store={store}>
          {store.showingDescription && (
            <Segment>
              <div dangerouslySetInnerHTML={{ __html: store.description }} />
            </Segment>
          )}

          <div className={stCommon + " ls-common"}>
            <div className={styles["main-content-wrapper"]}>
              <AnnotationTabs
                store={store}
                showAnnotations={store.hasInterface("annotations:tabs")}
                showPredictions={store.hasInterface("predictions:tabs")}
                allowCreateNew={store.hasInterface("annotations:add-new")}
              />
              {as.validation === null
                ? this._renderUI(root, store, as, settings)
                : this.renderConfigValidationException()}
            </div>
            <div className={stMenu + " ls-menu"}>
              {store.hasInterface("side-column") && !as.viewingAllAnnotations && !as.viewingAllPredictions && (
                <SidebarToggle active="annotation">
                  <SidebarPage name="annotation" title="Annotation">
                    <AnnotationTab store={store} />
                  </SidebarPage>
                  {this.props.panels.map(({name, title, Component}) => (
                    <SidebarPage key={name} name={name} title={title}>
                      <Component/>
                    </SidebarPage>
                  ))}
                </SidebarToggle>
              )}
            </div>
          </div>
        </Provider>
        {store.hasInterface("debug") && <Debug store={store} />}
      </div>
    );
  }
}

export default observer(App);
