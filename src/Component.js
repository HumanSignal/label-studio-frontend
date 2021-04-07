import { Component } from "react";
import App from "./components/App/App";
import { configureStore } from "./configureStore";
import { registerPanels } from "./registerPanels";

export class LabelStudio extends Component {
  state = {}

  componentDidMount() {
    configureStore(this.props).then(({store}) => {
      this.setState({ store });
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.task !== prevProps.task) {
      this.lsf.resetState();
      this.lsf.assignTask(this.props.task);
      this.lsf.initializeStore(this.props.task);
    }
  }

  render() {
    return this.lsf ? (
      <App
        store={this.lsf}
        panels={registerPanels(this.props.panels) ?? []}
      />
    ) : null;
  }

  get lsf() {
    return this.state.store;
  }
}
