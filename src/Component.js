import { Component } from "react";
import App from "./components/App/App";
import { configureStore } from "./configureStore";
import { registerPanels } from "./registerPanels";

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
        panels={registerPanels(this.props.panels) ?? []}
      />
    ) : null;
  }
}
