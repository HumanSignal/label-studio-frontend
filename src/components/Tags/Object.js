import React from "react";
import { PropTypes } from "prop-types";
import { observer } from "mobx-react";

/**
 * Object Tag Component
 */
class ObjectTagView extends React.Component {
  render () {
    const { props } = this;
    const { item } = props;

    const moreProps = item.getProps && item.getProps();

    return (
      <div className={props.className} dataneedsupdate={item._needsUpdate} style={props.style} {...moreProps}>
        {props.children}
      </div>
    );
  }
}

ObjectTagView.propTypes = {
  children: PropTypes.node.isRequired,
  item: PropTypes.object.isRequired,
};

export default observer(ObjectTagView);
