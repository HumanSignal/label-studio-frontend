import React, { Component } from "react";
import { Form, Input, Button } from "antd";

import { observer } from "mobx-react";

class DebugComponent extends Component {
  state = {
    res: null,
    config: this.props.store.config,
    data: this.props.store.task.data,
    completions: "",
  };

  render() {
    const self = this;
    const { store } = this.props;
    const completion = store.completionStore.selected;

    return (
      <div>
        <br />
        <h2>Debug</h2>
        <div>
          <Button
            onClick={ev => {
              this.setState({ res: JSON.stringify(store.completionStore.selected.toJSON()) });
            }}
          >
            Serialize whole tree
          </Button>

          <Button
            onClick={ev => {
              this.setState({ res: JSON.stringify(store.completionStore.selected.serializeCompletion()) });
            }}
          >
            Seriealize results tree
          </Button>

          <Button
            onClick={ev => {
              if (self.state.res) completion.deserializeCompletion(JSON.parse(self.state.res));
            }}
          >
            Load Serialized Results
          </Button>

          <Button
            onClick={ev => {
              const c = store.completionStore.addInitialCompletion();
              store.completionStore.selectCompletion(c.id);

              if (self.state.res) c.deserializeCompletion(JSON.parse(self.state.res));
              // this.setState.res;
            }}
          >
            Load As New Completion
          </Button>

          <Button
            onClick={ev => {
              this.setState({ res: store.task.data });
            }}
          >
            Task data
          </Button>

          <Button
            onClick={ev => {
              // this.setState.res;
              const data = JSON.parse(self.state.res);
              const task = {
                id: data["id"],
                project: 2,
                data: JSON.stringify(data),
              };

              store.resetState();
              store.addTask(task);
              store.addGeneratedCompletion(task);
              store.markLoading(false);

              if (store.completionStore.selected)
                store.completionStore.selected.traverseTree(node => node.updateValue && node.updateValue(self));
            }}
          >
            Simulate Loading Task
          </Button>
        </div>

        <Form>
          <div style={{ display: "flex" }}>
            <div style={{ flexBasis: "50%" }}>
              <p>Config</p>
              <Input.TextArea
                rows={22}
                value={this.state.config}
                className="is-search"
                onChange={ev => {
                  this.setState({ config: ev.target.value });
                }}
              />
            </div>
            <div style={{ flexBasis: "50%" }}>
              <p>Data</p>
              <Input.TextArea
                rows={10}
                value={this.state.data}
                className="is-search"
                onChange={ev => {
                  this.setState({ data: ev.target.value });
                }}
              />
              <p>Completions</p>
              <Input.TextArea
                rows={10}
                value={this.state.completions}
                className="is-search"
                onChange={ev => {
                  this.setState({ completions: ev.target.value });
                }}
              />
            </div>
          </div>
          <Button
            style={{ width: "100%" }}
            onClick={ev => {
              const { config } = this.state;
              const completions = JSON.parse(this.state.completions || `[{ "result": [] }]`);
              const data = JSON.parse(this.state.data);

              store.resetState();
              store.assignConfig(config);
              store.assignTask({ data });
              store.initializeStore({ completions, predictions: [] });
              const cs = store.completionStore;
              if (cs.completions.length) cs.selectCompletion(cs.completions[0].id);
            }}
          >
            Apply
          </Button>
        </Form>
      </div>
    );
  }
}

export default observer(DebugComponent);
