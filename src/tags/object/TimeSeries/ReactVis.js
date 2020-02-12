//
// Load our data file
//

// Styling relates a channel to its rendering properties. In this way you
// can achieve consistent styles across different charts and labels by supplying
// the components with this styler object

import {
  AbstractSeries,
  Borders,
  DiscreteColorLegend,
  HorizontalGridLines,
  LineSeries,
  ScaleUtils,
  VerticalGridLines,
  XAxis,
  XYPlot,
  //    YAxis,
} from "react-vis";

const totalValues = 10000;

/**
 * Get the array of x and y pairs.
 * The function tries to avoid too large changes of the chart.
 * @param {number} total Total number of values.
 * @returns {Array} Array of data.
 * @private
 */
function getRandomSeriesData(total) {
  const result = [];
  let lastY = Math.random() * 40 - 20;
  let y;
  const firstY = lastY;
  for (let i = 0; i < total; i++) {
    y = Math.random() * firstY - firstY / 2 + lastY;
    result.push({
      x: i,
      y,
    });
    lastY = y;
  }
  return result;
}

class CustomAxisLabel extends React.PureComponent {
  render() {
    const yLabelOffset = {
      y: this.props.marginTop + this.props.innerHeight / 2 + this.props.title.length * 2,
      x: 10,
    };

    const xLabelOffset = {
      x: this.props.marginLeft + this.props.innerWidth / 2 - this.props.title.length * 2,
      y: 1.2 * this.props.innerHeight,
    };

    const transform = this.props.xAxis
      ? `translate(${xLabelOffset.x}, ${xLabelOffset.y})`
      : `translate(${yLabelOffset.x}, ${yLabelOffset.y}) rotate(-90)`;

    return (
      <g transform={transform}>
        <text className="unselectable axis-labels">{this.props.title}</text>
      </g>
    );
  }
}

CustomAxisLabel.displayName = "CustomAxisLabel";
CustomAxisLabel.requiresSVG = true;

class Highlight extends AbstractSeries {
  static displayName = "HighlightOverlay";
  static defaultProps = {
    allow: "x",
    color: "rgb(77, 182, 172)",
    opacity: 0.3,
  };

  state = {
    drawing: false,
    drawArea: { top: 0, right: 0, bottom: 0, left: 0 },
    x_start: 0,
    y_start: 0,
    x_mode: false,
    y_mode: false,
    xy_mode: false,
  };

  constructor(props) {
    super(props);
    document.addEventListener(
      "mouseup",
      function(e) {
        this.stopDrawing();
      }.bind(this),
    );
  }

  _cropDimension(loc, startLoc, minLoc, maxLoc) {
    if (loc < startLoc) {
      return {
        start: Math.max(loc, minLoc),
        stop: startLoc,
      };
    }

    return {
      stop: Math.min(loc, maxLoc),
      start: startLoc,
    };
  }

  _getDrawArea(loc) {
    const { innerWidth, innerHeight } = this.props;
    const { x_mode, y_mode, xy_mode } = this.state;
    const { drawArea, x_start, y_start } = this.state;
    const { x, y } = loc;
    let out = drawArea;

    if (x_mode | xy_mode) {
      // X mode or XY mode
      const { start, stop } = this._cropDimension(x, x_start, 0, innerWidth);
      out = {
        ...out,
        left: start,
        right: stop,
      };
    }
    if (y_mode | xy_mode) {
      // Y mode or XY mode
      const { start, stop } = this._cropDimension(y, y_start, 0, innerHeight);
      out = {
        ...out,
        top: innerHeight - start,
        bottom: innerHeight - stop,
      };
    }
    return out;
  }

  onParentMouseDown(e) {
    const { innerHeight, innerWidth, onBrushStart } = this.props;
    const { x, y } = this._getMousePosition(e);
    const y_rect = innerHeight - y;

    // Define zoom mode
    if ((x < 0) & (y >= 0)) {
      // Y mode
      this.setState({
        y_mode: true,
        drawing: true,
        drawArea: {
          top: y_rect,
          right: innerWidth,
          bottom: y_rect,
          left: 0,
        },
        y_start: y,
      });
    } else if ((x >= 0) & (y < 0)) {
      // X mode
      this.setState({
        x_mode: true,
        drawing: true,
        drawArea: {
          top: innerHeight,
          right: x,
          bottom: 0,
          left: x,
        },
        x_start: x,
      });
    } else if ((x >= 0) & (y >= 0)) {
      // XY mode
      this.setState({
        xy_mode: true,
        drawing: true,
        drawArea: {
          top: y_rect,
          right: x,
          bottom: y_rect,
          left: x,
        },
        x_start: x,
        y_start: y,
      });
    }

    // onBrushStart callback
    if (onBrushStart) {
      onBrushStart(e);
    }
  }

  stopDrawing() {
    // Reset zoom state
    this.setState({
      x_mode: false,
      y_mode: false,
      xy_mode: false,
    });

    // Quickly short-circuit if the user isn't drawing in our component
    if (!this.state.drawing) {
      return;
    }

    const { onBrushEnd } = this.props;
    const { drawArea } = this.state;
    const xScale = ScaleUtils.getAttributeScale(this.props, "x");
    const yScale = ScaleUtils.getAttributeScale(this.props, "y");

    // Clear the draw area
    this.setState({
      drawing: false,
      drawArea: { top: 0, right: 0, bottom: 0, left: 0 },
      x_start: 0,
      y_start: 0,
    });

    // Invoke the callback with null if the selected area was < 5px
    if (Math.abs(drawArea.right - drawArea.left) < 5) {
      onBrushEnd(null);
      return;
    }

    // Compute the corresponding domain drawn
    const domainArea = {
      bottom: yScale.invert(drawArea.top),
      right: xScale.invert(drawArea.right),
      top: yScale.invert(drawArea.bottom),
      left: xScale.invert(drawArea.left),
    };

    if (onBrushEnd) {
      onBrushEnd(domainArea);
    }
  }

  _getMousePosition(e) {
    // Get graph size
    const { marginLeft, marginTop, innerHeight } = this.props;

    // Compute position in pixels relative to axis
    const loc_x = e.nativeEvent.offsetX - marginLeft;
    const loc_y = innerHeight + marginTop - e.nativeEvent.offsetY;

    // Return (x, y) coordinates
    return {
      x: loc_x,
      y: loc_y,
    };
  }

  onParentMouseMove(e) {
    const { drawing } = this.state;

    if (drawing) {
      const pos = this._getMousePosition(e);
      const newDrawArea = this._getDrawArea(pos);
      this.setState({ drawArea: newDrawArea });
    }
  }

  render() {
    const { marginLeft, marginTop, innerWidth, innerHeight, color, opacity } = this.props;
    const {
      drawArea: { left, right, top, bottom },
    } = this.state;
    return (
      <g transform={`translate(${marginLeft}, ${marginTop})`} className="highlight-container">
        <rect className="mouse-target" fill="black" opacity="0" x={0} y={0} width={innerWidth} height={innerHeight} />
        <rect
          className="highlight"
          pointerEvents="none"
          opacity={opacity}
          fill={color}
          x={left}
          y={bottom}
          width={right - left}
          height={top - bottom}
        />
      </g>
    );
  }
}

class TSSlider extends React.Component {
  render() {
    return <Slider />;
  }
}

class HtxTimeSeriesView extends React.Component {
  state = {
    lastDrawLocation: null,
    series: [
      {
        title: "Apples",
        disabled: false,
        data: getRandomSeriesData(totalValues),
      },
      {
        title: "Bananas",
        disabled: false,
        data: getRandomSeriesData(totalValues),
      },
    ],
  };

  render() {
    const { series, lastDrawLocation } = this.state;
    const { item } = this.props;

    return (
      <div className="example-with-click-me">
        {Tree.renderChildren(item)}

        <div className="legend">
          <DiscreteColorLegend width={180} items={series} />
        </div>

        <div
          className="chart no-select"
          onDragStart={function(e) {
            e.preventDefault();
          }}
        >
          <XYPlot
            xDomain={lastDrawLocation && [lastDrawLocation.left, lastDrawLocation.right]}
            yDomain={lastDrawLocation && [lastDrawLocation.bottom, lastDrawLocation.top]}
            height={300}
            width={600}
            margin={{ left: 45, right: 20, top: 10, bottom: 45 }}
          >
            <HorizontalGridLines />
            <VerticalGridLines />

            {series.map(entry => (
              <LineSeries key={entry.title} data={entry.data} />
            ))}

            <Highlight
              onBrushEnd={area => {
                // this.setState(
                //   { lastDrawLocation: area }
                // )
              }}
            />
            <Borders style={{ all: { fill: "#fff" } }} />
            <XAxis tickFormat={v => <tspan className="unselectable"> {v} </tspan>} />
            <YAxis tickFormat={v => <tspan className="unselectable"> {v} </tspan>} />
            <CustomAxisLabel title={"Time [s]"} xAxis />
            <CustomAxisLabel title={"Value [-]"} />
          </XYPlot>

          <TSSlider />
        </div>
      </div>
    );
  }
}
