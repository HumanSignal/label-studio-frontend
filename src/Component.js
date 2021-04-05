import { Component } from "react";
import App from "./components/App/App";
import { configureStore } from "./configureStore";
import { inject, observer } from "mobx-react";

export class LabelStudio extends Component {
  componentDidMount() {
    configureStore(this.props).then(({store}) => {
      this.setState({ store });
    });
  }

  render() {
    return this.state.store ? (
      <App
        store={this.state.store}
        panels={(this.props.panels ?? []).map(panel => ({
          ...panel,
          Component: panel.builder({ inject, observer })
        }))}
      />
    ) : null;
  }
}
