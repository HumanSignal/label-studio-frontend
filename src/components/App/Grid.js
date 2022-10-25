import React, { Component } from "react";
import { Button } from "antd";
import { LeftCircleOutlined, RightCircleOutlined } from "@ant-design/icons";
import styles from "./Grid.module.scss";
import { EntityTab } from "../AnnotationTabs/AnnotationTabs";
import { Annotation } from "./Annotation";
export default class Grid extends Component {
  container = React.createRef();

  shift = delta => {
    const container = this.container.current;
    const children = container.children;

    const current = Array.from(children).findIndex(child => container.scrollLeft <= child.offsetLeft);

    if (!container) return;
    
    const count = this.props.annotations.length;
    const next = current + delta; 
    
    if (next < 0 || next > count - 1) return;
    const newPosition = children[next].offsetLeft;

    container.scrollTo({ left: newPosition, top: 0, behavior: "smooth" });
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
    const { annotations } = this.props;

    return (
      <div className={styles.container}>
        <div ref={this.container} className={styles.grid}>
          {annotations.filter(c => !c.hidden).map((c) => (
            <div id={`c-${c.id}`} key={`anno-${c.id}`} style={{ position: 'relative' }}>
              <EntityTab
                entity={c}
                onClick={() => this.select(c)}
                prediction={c.type === "prediction"}
                bordered={false}
                style={{ height: 44 }}
              />
              <Annotation root={this.props.root} annotation={c} />
            </div>
          ))}
        </div>
        <Button type="text" onClick={this.left} className={styles.left} icon={<LeftCircleOutlined />} />
        <Button type="text" onClick={this.right} className={styles.right} icon={<RightCircleOutlined />} />
      </div>
    );
  }
}
