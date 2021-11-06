import { Component, CSSProperties } from "react";
import { Block } from "../../utils/bem";

import "./Hint.styl";

interface HintProps {
  copy?: string;
  style?: CSSProperties;
  className?: string;
}

/**
 * Hint Component
 */
export default class Hint extends Component<HintProps> {
  render() {
    return (
      <Block
        name="hint"
        tag="sup"
        className={this.props.className}
        data-copy={this.props.copy}
        style={this.props.style}
      >
        {this.props.children}
      </Block>
    );
  }
}
