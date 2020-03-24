import React, { Component, Fragment } from "react";
import { Button, Divider, Slider, Tooltip } from "antd";
import { observer } from "mobx-react";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  BgColorsOutlined,
  ToolOutlined,
  HighlightOutlined,
  ScissorOutlined,
} from "@ant-design/icons";

import styles from "./ImageControls.module.scss";

export default observer(
  class ImageControls extends Component {
    render() {
      /**
       * Control for brightness
       */
      let brightnessControl = (
        <Fragment>
          <Slider
            defaultValue={100}
            max={200}
            min={0}
            vertical
            tipFormatter={null}
            style={{ height: 50 }}
            onChange={value => {
              this.props.updateBrightness(value);
            }}
          />
        </Fragment>
      );
      let gridSizeControl = (
        <Fragment>
          <Slider
            defaultValue={this.props.item.gridSize}
            max={65}
            min={20}
            vertical
            tipFormatter={null}
            style={{ height: 50 }}
            onChange={value => {
              this.props.updateGridSize(value);
            }}
          />
        </Fragment>
      );
      /**
       * Control for zoom
       */
      let zoomControls = (
        <Fragment>
          <Button
            shape="circle"
            icon={<ZoomInOutlined />}
            className={styles.button}
            onClick={event => {
              this.props.handleZoom(1.2);
            }}
          ></Button>
          <Button
            shape="circle"
            icon={<ZoomOutOutlined />}
            className={styles.button}
            onClick={() => {
              this.props.handleZoom(0.8);
            }}
          ></Button>
        </Fragment>
      );
      let brushControls = (
        <Fragment>
          <Tooltip title="Floodfill tool">
            <Button
              shape="circle"
              type={"default"}
              className={styles.button}
              onClick={() => {
                // this.props.updateBrushControl("brush");
              }}
            >
              <BgColorsOutlined />
            </Button>
          </Tooltip>

          <Tooltip title="Livewire tool">
            <Button
              shape="circle"
              type={"default"}
              className={styles.button}
              onClick={() => {
                // this.props.updateBrushControl("brush");
              }}
            >
              <ToolOutlined />
            </Button>
          </Tooltip>

          <Tooltip title="Brush tool">
            <Button
              shape="circle"
              type={this.props.item.brushControl === "brush" ? "primary" : "default"}
              className={styles.button}
              onClick={() => {
                this.props.updateBrushControl("brush");
              }}
            >
              <HighlightOutlined />
            </Button>
          </Tooltip>

          <Slider
            defaultValue={100}
            max={200}
            min={0}
            vertical
            tipFormatter={null}
            style={{ height: 50 }}
            onChange={value => {
              this.props.updateBrushStrokeWidth(value);
            }}
          />

          <Button
            shape="circle"
            type={this.props.item.brushControl === "eraser" ? "primary" : "default"}
            className={styles.button}
            onClick={() => {
              this.props.updateBrushControl("eraser");
            }}
          >
            <ScissorOutlined />
          </Button>
        </Fragment>
      );
      return (
        <div className={styles.block}>
          {this.props.item.brightness ? brightnessControl : null}
          {this.props.item.zoom ? zoomControls : null}
          {this.props.item.grid ? gridSizeControl : null}
          {this.props.item.controlButton().type === "brushlabels" ? brushControls : null}
        </div>
      );
    }
  },
);
