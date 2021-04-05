import React, { Component } from "react";
import { Button } from "antd";
import { LeftCircleOutlined, RightCircleOutlined } from "@ant-design/icons";
import Tree from "../../core/Tree";
import styles from "./App.module.scss";

/***** DON'T TRY THIS AT HOME *****/
/*
Grid renders a container which remains untouched all the process.
On every rerender it renders Item with next annotation in the list.
Rendered annotation is cloned into the container. And index of "current" annotation increases.
This triggers next rerender with next annotation until all the annotations are rendered.
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
    item: 0,
  };
  container = React.createRef();

  onFinish = () => {
    const c = this.container.current;
    if (!c) return;

    const item = c.children[c.children.length - 1];
    const clone = item.cloneNode(true);
    c.children[this.state.item].appendChild(clone);

    /* canvas are cloned empty, so clone their content */
    const sourceCanvas = item.querySelectorAll("canvas");
    const clonedCanvas = clone.querySelectorAll("canvas");
    clonedCanvas.forEach((canvas, i) => {
      canvas.getContext("2d").drawImage(sourceCanvas[i], 0, 0);
    });

    this.setState({ item: this.state.item + 1 });
  };

  shift = delta => {
    const c = this.container.current;
    if (!c) return;
    const gap = 30;
    const step = (c.offsetWidth + gap) / 2;
    const current = (c.scrollLeft + delta) / step;
    const next = delta > 0 ? Math.ceil(current) : Math.floor(current);
    const count = this.props.annotations.length;
    if (next < 0 || next > count - 2) return;
    c.scrollTo({ left: next * step, top: 0, behavior: "smooth" });
  };

  left = () => {
    this.shift(-1);
  };

  right = () => {
    this.shift(1);
  };

  select = c => {
    const { store } = this.props;
    c.type === "annotation" ? store.selectAnnotation(c.id) : store.selectPrediction(c.id);
  };

  render() {
    const i = this.state.item;
    const { annotations } = this.props;
    const renderNext = i < annotations.length;
    if (renderNext) {
      this.props.store._selectItem(annotations[i]);
    } else {
      this.props.store._unselectAll();
    }

    return (
      <div className={styles.container}>
        <div ref={this.container} className={styles.grid}>
          {annotations.map((c, i) => (
            <div style={{ display: c.hidden ? "none" : "unset" }} id={`c-${c.id}`}>
              <h4 onClick={() => this.select(c)}>
                {c.pk || c.id}
                {c.type === "annotation" && c.createdBy ? ` by ${c.createdBy}` : null}
                {c.type === "prediction" && c.createdBy ? ` from model (${c.createdBy})` : null}
              </h4>
            </div>
          ))}
          {renderNext && <Item root={this.props.root} onFinish={this.onFinish} key={this.state.item} />}
        </div>
        <Button type="text" onClick={this.left} className={styles.left} icon={<LeftCircleOutlined />} />
        <Button type="text" onClick={this.right} className={styles.right} icon={<RightCircleOutlined />} />
      </div>
    );
  }
}
