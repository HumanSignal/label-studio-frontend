import React, { Component } from "react";
import Tree from "../../core/Tree";
import styles from "./App.module.scss";

/***** DON'T TRY THIS AT HOME *****/
/*
Grid renders a container which remains untouched all the process.
On every rerender it renders Item with next completion in the list.
Rendered completion is cloned into the container. And index of "current" completion increases.
This triggers next rerender with next completion until all the completions are rendered.
*/

class Item extends Component {
  componentDidMount() {
    // ~2 ticks for canvas to be rendered and resized completely
    setTimeout(this.props.onFinish, 32);
  }

  render() {
    return Tree.renderItem(this.props.root);
  }
}

export default class Grid extends Component {
  state = {
    count: 0,
    item: 0,
  };

  container = React.createRef();

  onFinish = () => {
    const c = this.container.current;
    if (!c) return;

    const item = c.children[c.children.length - 1];
    const clone = item.cloneNode(true);
    c.insertBefore(clone, c.lastChild);

    /* canvas are cloned empty, so clone their content */
    const sourceCanvas = item.querySelectorAll("canvas");
    const clonedCanvas = clone.querySelectorAll("canvas");
    clonedCanvas.forEach((canvas, i) => {
      canvas.getContext("2d").drawImage(sourceCanvas[i], 0, 0);
    });

    this.setState({ item: this.state.item + 1 });
  };

  render() {
    if (this.state.item < this.props.completions.length) {
      this.props.store._selectItem(this.props.completions[this.state.item]);
      return (
        <div ref={this.container} className={styles.grid}>
          <Item root={this.props.root} onFinish={this.onFinish} key={this.state.item} />
        </div>
      );
    }

    return <div ref={this.container} className={styles.grid}></div>;
  }
}
