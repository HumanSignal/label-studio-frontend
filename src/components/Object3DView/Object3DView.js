import React, {
  Component,
  createRef,
  forwardRef,
  Fragment,
  memo,
  useEffect,
  useRef,
  useState
} from 'react';
import { Group, Layer, Line, Rect, Stage } from 'react-konva';
import { observer } from 'mobx-react';
import { getEnv, getRoot, isAlive } from 'mobx-state-tree';

import Object3DGrid from '../Object3DGrid/Object3DGrid';
import Object3DTransformer from '../Object3DTransformer/Object3DTransformer';
import ObjectTag from '../../components/Tags/Object';
import Tree from '../../core/Tree';
import styles from './Object3DView.module.scss';
import { errorBuilder } from '../../core/DataValidator/ConfigValidator';
import { chunks, findClosestParent } from '../../utils/utilities';
import Konva from 'konva';
import { LoadingOutlined } from '@ant-design/icons';
import { Toolbar } from '../Toolbar/Toolbar';
import { Object3DViewProvider } from './Object3DViewContext';
import { Hotkey } from '../../core/Hotkey';
import { useObserver } from 'mobx-react';
import ResizeObserver from '../../utils/resize-observer';
import { debounce } from '../../utils/debounce';
import Constants from '../../core/Constants';
import { fixRectToFit } from '../../utils/image';
import {
  FF_DBLCLICK_DELAY,
  FF_DEV_1285,
  FF_DEV_1442,
  FF_DEV_3077,
  FF_DEV_3793,
  FF_DEV_4081,
  FF_LSDV_4583_6,
  FF_LSDV_4711,
  FF_LSDV_4930, FF_ZOOM_OPTIM,
  isFF
} from '../../utils/feature-flags';
import * as THREE from 'three';
import { forwardRef, useRef, useMemo, useState } from 'react';
import { Color, Vector3 } from 'three';
import { Canvas } from '@react-three/fiber';
import { View, Center, Environment, MapControls, OrbitControls, PivotControls, RandomizedLight, Gltf,} from '@react-three/drei';
import { PerspectiveCamera, OrthographicCamera, AccumulativeShadows } from '@react-three/drei';
import { Menu, Button } from '@mantine/core';
import * as ICONS from '@tabler/icons';
import useRefs from 'react-use-refs';
import create from 'zustand';

Konva.showWarnings = false;

const hotkeys = Hotkey('Object3D');
const imgDefaultProps = {};

if (isFF(FF_LSDV_4711)) imgDefaultProps.crossOrigin = 'anonymous';

const splitRegions = (regions) => {
  const brushRegions = [];
  const shapeRegions = [];
  const l = regions.length;
  let i = 0;

  for (i; i < l; i++) {
    const region = regions[i];

    if (region.type === 'brushregion') {
      brushRegions.push(region);
    } else {
      shapeRegions.push(region);
    }
  }

  return {
    brushRegions,
    shapeRegions,
  };
};

const Region = memo(({ region, showSelected = false }) => {
  if (isFF(FF_DBLCLICK_DELAY)) {
    return useObserver(() => Tree.renderItem(region, region.annotation, true));
  }
  return useObserver(() => region.inSelection !== showSelected ? null : Tree.renderItem(region, region.annotation, false));
});

const RegionsLayer = memo(({ regions, name, useLayers, showSelected = false }) => {
  const content = regions.map((el) => (
    <Region key={`region-${el.id}`} region={el} showSelected={showSelected} />
  ));

  return useLayers === false ? (
    content
  ) : (
    <Layer name={name}>
      {content}
    </Layer>
  );
});

const Regions = memo(({ regions, useLayers = true, chunkSize = 15, suggestion = false, showSelected = false }) => {
  return (
    <Object3DViewProvider value={{ suggestion }}>
      {(chunkSize ? chunks(regions, chunkSize) : regions).map((chunk, i) => (
        <RegionsLayer
          key={`chunk-${i}`}
          name={`chunk-${i}`}
          regions={chunk}
          useLayers={useLayers}
          showSelected={showSelected}
        />
      ))}
    </Object3DViewProvider>
  );
});

const DrawingRegion = observer(({ item }) => {
  const { drawingRegion } = item;

  if (!drawingRegion) return null;
  if (item.multiObject3D && item.currentObject3D !== drawingRegion.item_index) return null;

  const Wrapper = drawingRegion && drawingRegion.type === 'brushregion' ? Fragment : Layer;

  return (
    <Wrapper>
      {drawingRegion ? <Region key={'drawing'} region={drawingRegion} /> : drawingRegion}
    </Wrapper>
  );
});

const SELECTION_COLOR = '#40A9FF';
const SELECTION_SECOND_COLOR = 'white';
const SELECTION_DASH = [3, 3];

/**
 * Multiple selected regions when transform is unavailable — just a box with anchors
 */
const SelectionBorders = observer(({ item, selectionArea }) => {
  const { selectionBorders: bbox } = selectionArea;

  if (!isFF(FF_DEV_3793)) {
    bbox.left = bbox.left * item.stageScale;
    bbox.right = bbox.right * item.stageScale;
    bbox.top = bbox.top * item.stageScale;
    bbox.bottom = bbox.bottom * item.stageScale;
  }

  const points = bbox ? [
    {
      x: bbox.left,
      y: bbox.top,
    },
    {
      x: bbox.right,
      y: bbox.top,
    },
    {
      x: bbox.left,
      y: bbox.bottom,
    },
    {
      x: bbox.right,
      y: bbox.bottom,
    },
  ] : [];
  const ANCHOR_SIZE = isFF(FF_DEV_3793) ? 6 / item.stageScale : 6;

  return (
    <>
      {bbox && (
        <Rect
          name="regions_selection"
          x={bbox.left}
          y={bbox.top}
          width={bbox.right - bbox.left}
          height={bbox.bottom - bbox.top}
          stroke={SELECTION_COLOR}
          strokeWidth={1}
          strokeScaleEnabled={false}
          listening={false}
        />
      )}
      {points.map((point, idx) => {
        return (
          <Rect
            key={idx}
            x={point.x - ANCHOR_SIZE / 2}
            y={point.y - ANCHOR_SIZE / 2}
            width={ANCHOR_SIZE}
            height={ANCHOR_SIZE}
            fill={SELECTION_COLOR}
            stroke={SELECTION_SECOND_COLOR}
            strokeWidth={2}
            strokeScaleEnabled={false}
            listening={false}
          />
        );
      })}
    </>
  );
});

/**
 * Selection area during selection — dashed rect
 */
const SelectionRect = observer(({ item }) => {
  const { x, y, width, height } = item.onCanvasRect;

  const positionProps = {
    x,
    y,
    width,
    height,
    listening: false,
    strokeWidth: 1,
  };

  return (
    <>
      <Rect
        {...positionProps}
        stroke={SELECTION_COLOR}
        dash={SELECTION_DASH}
        strokeScaleEnabled={false}
      />
      <Rect
        {...positionProps}
        stroke={SELECTION_SECOND_COLOR}
        dash={SELECTION_DASH}
        dashOffset={SELECTION_DASH[0]}
        strokeScaleEnabled={false}
      />
    </>
  );
});

const TRANSFORMER_BACK_ID = 'transformer_back';

const TransformerBack = observer(({ item }) => {
  const { selectedRegionsBBox } = item;
  const singleNodeMode = item.selectedRegions.length === 1;
  const dragStartPointRef = useRef({ x: 0, y: 0 });

  return (
    <Layer>
      {selectedRegionsBBox && !singleNodeMode && (
        <Rect
          id={TRANSFORMER_BACK_ID}
          fill="rgba(0,0,0,0)"
          draggable
          onClick={() => {
            item.annotation.unselectAreas();
          }}
          onMouseOver={(ev) => {
            if (!item.annotation.relationMode) {
              ev.target.getStage().container().style.cursor = Constants.POINTER_CURSOR;
            }
          }}
          onMouseOut={(ev) => {
            ev.target.getStage().container().style.cursor = Constants.DEFAULT_CURSOR;
          }}
          onDragStart={e => {
            dragStartPointRef.current = {
              x: item.canvasToInternalX(e.target.getAttr('x')),
              y: item.canvasToInternalY(e.target.getAttr('y')),
            };
          }}
          dragBoundFunc={(pos) => {
            let { x, y } = pos;
            const { top, left, right, bottom } = item.selectedRegionsBBox;
            const { stageHeight, stageWidth } = item;

            const offset = {
              x: dragStartPointRef.current.x - left,
              y: dragStartPointRef.current.y - top,
            };

            x -= offset.x;
            y -= offset.y;

            const bbox = { x, y, width: right - left, height: bottom - top };

            const fixed = fixRectToFit(bbox, stageWidth, stageHeight);

            if (fixed.width !== bbox.width) {
              x += (fixed.width - bbox.width) * (fixed.x !== bbox.x ? -1 : 1);
            }

            if (fixed.height !== bbox.height) {
              y += (fixed.height - bbox.height) * (fixed.y !== bbox.y ? -1 : 1);
            }

            x += offset.x;
            y += offset.y;
            return { x, y };
          }}
        />
      )}
    </Layer>
  );
});

const SelectedRegions = observer(({ item, selectedRegions }) => {
  if (!selectedRegions) return null;
  const { brushRegions = [], shapeRegions = [] } = splitRegions(selectedRegions);

  return (
    <>
      {
        isFF(FF_LSDV_4930)
          ? null
          : <TransformerBack item={item} />
      }
      {brushRegions.length > 0 && (
        <Regions
          key="brushes"
          name="brushes"
          regions={brushRegions}
          useLayers={false}
          showSelected
          chankSize={0}
        />
      )}

      {shapeRegions.length > 0 && (
        <Regions
          key="shapes"
          name="shapes"
          regions={shapeRegions}
          showSelected
          chankSize={0}
        />
      )}
    </>
  );
});

const SelectionLayer = observer(({ item, selectionArea }) => {
  const scale = isFF(FF_DEV_3793) ? 1 : 1 / (item.zoomScale || 1);
  const [isMouseWheelClick, setIsMouseWheelClick] = useState(false);
  const [shift, setShift] = useState(false);
  const isPanTool = item.getToolsManager().findSelectedTool()?.fullName === 'ZoomPanTool';

  const dragHandler = (e) => setIsMouseWheelClick(e.buttons === 4);

  const handleKey = (e) => setShift(e.shiftKey);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    window.addEventListener('mousedown', dragHandler);
    window.addEventListener('mouseup', dragHandler);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      window.removeEventListener('mousedown', dragHandler);
      window.removeEventListener('mouseup', dragHandler);
    };
  }, []);

  const disableTransform = item.zoomScale > 1 && (shift || isPanTool || isMouseWheelClick);

  let supportsTransform = true;
  let supportsRotate = true;
  let supportsScale = true;

  item.selectedRegions?.forEach(shape => {
    supportsTransform = supportsTransform && shape.supportsTransform === true;
    supportsRotate = supportsRotate && shape.canRotate === true;
    supportsScale = supportsScale && true;
  });

  supportsTransform =
    supportsTransform &&
    (item.selectedRegions.length > 1 ||
      ((item.useTransformer || item.selectedShape?.preferTransformer) && item.selectedShape?.useTransformer));

  return (
    <Layer scaleX={scale} scaleY={scale}>
      {selectionArea.isActive ? (
        <SelectionRect item={selectionArea} />
      ) : !supportsTransform && item.selectedRegions.length > 1 ? (
        <SelectionBorders item={item} selectionArea={selectionArea} />
      ) : null}
      <Object3DTransformer
        item={item}
        rotateEnabled={supportsRotate}
        supportsTransform={!disableTransform && supportsTransform}
        supportsScale={supportsScale}
        selectedShapes={item.selectedRegions}
        singleNodeMode={item.selectedRegions.length === 1}
        useSingleNodeRotation={item.selectedRegions.length === 1 && supportsRotate}
        draggableBackgroundSelector={`#${TRANSFORMER_BACK_ID}`}
      />
    </Layer>
  );
});

/**
 * Previously regions rerendered on window resize because of size recalculations,
 * but now they are rerendered just by mistake because of unmemoized `splitRegions` in main render.
 * This is temporary solution to pass in relevant props changed on window resize.
 */
const Selection = observer(({ item, ...triggeredOnResize }) => {
  const { selectionArea } = item;

  return (
    <>
      { isFF(FF_DBLCLICK_DELAY)
        ? <Layer name="selection-regions-layer" />
        : <SelectedRegions item={item} selectedRegions={item.selectedRegions} {...triggeredOnResize} />
      }
      <SelectionLayer item={item} selectionArea={selectionArea} />
    </>
  );
});

const Crosshair = memo(forwardRef(({ width, height }, ref) => {
  const [pointsV, setPointsV] = useState([50, 0, 50, height]);
  const [pointsH, setPointsH] = useState([0, 100, width, 100]);
  const [x, setX] = useState(100);
  const [y, setY] = useState(50);

  const [visible, setVisible] = useState(false);
  const strokeWidth = 1;
  const dashStyle = [3, 3];
  let enableStrokeScale = true;

  if (isFF(FF_DEV_1285)) {
    enableStrokeScale = false;
  }

  if (ref) {
    ref.current = {
      updatePointer(newX, newY) {
        if (newX !== x) {
          setX(newX);
          setPointsV([newX, 0, newX, height]);
        }

        if (newY !== y) {
          setY(newY);
          setPointsH([0, newY, width, newY]);
        }
      },
      updateVisibility(visibility) {
        setVisible(visibility);
      },
    };
  }

  return (
    <Layer
      name="crosshair"
      listening={false}
      opacity={visible ? 0.6 : 0}
    >
      <Group>
        <Line
          name="v-white"
          points={pointsH}
          stroke="#fff"
          strokeWidth={strokeWidth}
          strokeScaleEnabled={enableStrokeScale}
        />
        <Line
          name="v-black"
          points={pointsH}
          stroke="#000"
          strokeWidth={strokeWidth}
          dash={dashStyle}
          strokeScaleEnabled={enableStrokeScale}
        />
      </Group>
      <Group>
        <Line
          name="h-white"
          points={pointsV}
          stroke="#fff"
          strokeWidth={strokeWidth}
          strokeScaleEnabled={enableStrokeScale}
        />
        <Line
          name="h-black"
          points={pointsV}
          stroke="#000"
          strokeWidth={strokeWidth}
          dash={dashStyle}
          strokeScaleEnabled={enableStrokeScale}
        />
      </Group>
    </Layer>
  );
}));

export default observer(
  class Object3DView extends Component {
    // stored position of canvas before creating region

    constructor(props) {
      super(props);

    }

    render() {
      const [view1, view2, view3, view4] = useRefs();

      return (
        <div className="container">
          <Canvas shadows frameloop="demand" eventSource={document.getElementById('root')} className="canvas">
            <View index={1} track={view1}>
              <CameraSwitcher />
              <PivotControls scale={0.4} depthTest={false} matrix={matrix} />
              <Scene background="grey" matrix={matrix}>
                <AccumulativeShadows temporal frames={100} position={[0, -0.4, 0]} scale={14} alphaTest={0.85} color="grey" colorBlend={0.5}>
                  <RandomizedLight amount={8} radius={8} ambient={0.5} position={[5, 5, -10]} bias={0.001} />
                </AccumulativeShadows>
              </Scene>
              <OrbitControls makeDefault />
            </View>
            <View index={2} track={view2}>
              <PanelCamera which="top" />
              <PivotControls activeAxes={[true, true, false]} depthTest={false} matrix={matrix} />
              <Scene background="grey" matrix={matrix} />
              <MapControls makeDefault screenSpacePanning enableRotate={false} />
            </View>
            <View index={3} track={view3}>
              <PanelCamera which="middle" />
              <PivotControls activeAxes={[true, false, true]} depthTest={false} matrix={matrix} />
              <Scene background="grey" matrix={matrix} />
              <MapControls makeDefault screenSpacePanning enableRotate={false} />
            </View>
            <View index={4} track={view4}>
              <PanelCamera which="bottom" />
              <PivotControls activeAxes={[false, true, true]} depthTest={false} matrix={matrix} />
              <Scene background="grey" matrix={matrix} />
              <MapControls makeDefault screenSpacePanning enableRotate={false} />
            </View>
          </Canvas>
          {/** Tracking div's, regular HTML and made responsive with CSS media-queries ... */}
          <MainPanel ref={view1} />
          <SidePanel ref={view2} which="top" />
          <SidePanel ref={view3} which="middle" />
          <SidePanel ref={view4} which="bottom" />
        </div>
      )
    }
  },
);

const EntireStage = observer(({
  item,
  imagePositionClassnames,
  state,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragMove,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  crosshairRef,
}) => {
  const { store } = item;
  let size, position;

  if (isFF(FF_ZOOM_OPTIM)) {
    size = {
      width: item.containerWidth,
      height: item.containerHeight,
    };
    position = {
      x: item.zoomingPositionX + item.alignmentOffset.x,
      y: item.zoomingPositionY + item.alignmentOffset.y,
    };
  } else {
    size = { ...item.canvasSize };
    position = {
      x: item.zoomingPositionX,
      y: item.zoomingPositionY,
    };
  }

  return (
    <Stage
      ref={ref => {
        item.setStageRef(ref);
      }}
      className={[styles['image-element'],
        ...imagePositionClassnames,
      ].join(' ')}
      width={size.width}
      height={size.height}
      scaleX={item.zoomScale}
      scaleY={item.zoomScale}
      x={position.x}
      y={position.y}
      offsetX={item.stageTranslate.x}
      offsetY={item.stageTranslate.y}
      rotation={item.rotation}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragMove={onDragMove}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
    >
      <StageContent
        item={item}
        store={store}
        state={state}
        crosshairRef={crosshairRef}
      />
    </Stage>
  );
});

const StageContent = observer(({
  item,
  store,
  state,
  crosshairRef,
}) => {
  if (!isAlive(item)) return null;
  if (!store.task || !item.currentSrc) return null;

  const regions = item.regs;
  const paginationEnabled = !!item.isMultiItem;
  const wrapperClasses = [
    styles.wrapperComponent,
    item.images.length > 1 ? styles.withGallery : styles.wrapper,
  ];

  if (paginationEnabled) wrapperClasses.push(styles.withPagination);

  const {
    brushRegions,
    shapeRegions,
  } = splitRegions(regions);

  const {
    brushRegions: suggestedBrushRegions,
    shapeRegions: suggestedShapeRegions,
  } = splitRegions(item.suggestions);

  const renderableRegions = Object.entries({
    brush: brushRegions,
    shape: shapeRegions,
    suggestedBrush: suggestedBrushRegions,
    suggestedShape: suggestedShapeRegions,
  });

  return (
    <>
      {/* Hack to keep stage in place when there's no regions */}
      {regions.length === 0 && (
        <Layer>
          <Line points={[0, 0, 0, 1]} stroke="rgba(0,0,0,0)" />
        </Layer>
      )}
      {item.grid && item.sizeUpdated && <Object3DGrid item={item} />}

      {
        isFF(FF_LSDV_4930)
          ? <TransformerBack item={item} />
          : null
      }

      {renderableRegions.map(([groupName, list]) => {
        const isBrush = groupName.match(/brush/i) !== null;
        const isSuggestion = groupName.match('suggested') !== null;

        return list.length > 0 ? (
          <Regions
            key={groupName}
            name={groupName}
            regions={list}
            useLayers={isBrush === false}
            suggestion={isSuggestion}
          />
        ) : <Fragment key={groupName} />;
      })}
      <Selection
        item={item}
        isPanning={state.isPanning}
      />
      <DrawingRegion item={item} />

      {item.crosshair && (
        <Crosshair
          ref={crosshairRef}
          width={isFF(FF_ZOOM_OPTIM) ? item.containerWidth : (isFF(FF_DEV_1285) ? item.stageWidth : item.stageComponentSize.width)}
          height={isFF(FF_ZOOM_OPTIM) ? item.containerHeight : (isFF(FF_DEV_1285) ? item.stageHeight : item.stageComponentSize.height)}
        />
      )}
    </>
  );
});



function CameraSwitcher() {
  const projection = useStore((state) => state.projection)
  // Would need to remember the old coordinates to be more useful ...
  return projection === 'Perspective' ? (
    <PerspectiveCamera makeDefault position={[4, 4, 4]} fov={25} />
  ) : (
    <OrthographicCamera makeDefault position={[4, 4, 4]} zoom={280} />
  )
}

function PanelCamera({ which }) {
  const view = useStore((state) => state[which])
  return <OrthographicCamera makeDefault position={positions[view]} zoom={100} />
}

const MainPanel = forwardRef((props, fref) => {
  const projection = useStore((state) => state.projection)
  const setProjection = useStore((state) => state.setProjection)
  return (
    <div ref={fref} className="panel" style={{ gridArea: 'main' }}>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button>{projection}</Button>
        </Menu.Target>
        <Menu.Dropdown onClick={(e) => setProjection(e.target.innerText)}>
          <Menu.Item icon={<ICONS.IconPerspective size={14} />}>Perspective</Menu.Item>
          <Menu.Item icon={<ICONS.IconPerspectiveOff size={14} />}>Orthographic</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  )
})

const SidePanel = forwardRef(({ which }, fref) => {
  const value = useStore((state) => state[which])
  const setPanelView = useStore((state) => state.setPanelView)
  return (
    <div ref={fref} className="panel" style={{ gridArea: which }}>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button>{value}</Button>
        </Menu.Target>
        <Menu.Dropdown onClick={(e) => setPanelView(which, e.target.innerText)}>
          <Menu.Item icon={<ICONS.IconArrowBigTop size={14} />}>Top</Menu.Item>
          <Menu.Item icon={<ICONS.IconArrowBigDown size={14} />}>Bottom</Menu.Item>
          <Menu.Item icon={<ICONS.IconArrowBigLeft size={14} />}>Left</Menu.Item>
          <Menu.Item icon={<ICONS.IconArrowBigRight size={14} />}>Right</Menu.Item>
          <Menu.Item icon={<ICONS.IconHomeUp size={14} />}>Front</Menu.Item>
          <Menu.Item icon={<ICONS.IconHomeDown size={14} />}>Back</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  )
})


function Scene({ background = 'white', children, ...props }) {
  return (
    <>
      <color attach="background" args={[background]} />
      <ambientLight />
      <directionalLight position={[10, 10, -15]} castShadow shadow-bias={-0.0001} shadow-mapSize={1024} />
      <Environment preset="city" />
      <group
        matrixAutoUpdate={false}
        onUpdate={(self) => (self.matrix = matrix)}
        {...props}>
        <Center>
        <Box/> 

          <Gltf castShadow wireframereceiveShadow src="Perseverance-transformed.glb" />
        </Center>
        {children}
      </group>
    </>
  )
}

function Box({ text, ...props }) {
  const ref = useRef();
  const black = useMemo(() => new Color('black'), []);
  const lime = useMemo(() => new Color('lime'), []);
  const [hovered, setHovered] = useState(false);
  const transform = useRef();

  return (
    // <TransformControls ref={transform} mode="rotate">
      <>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        {...props}
        ref={ref}
      >
        <boxGeometry />
        <meshPhongMaterial color="orange" opacity={0.8} transparent />
        {props.children}
      </mesh><mesh
        {...props}
        ref={ref}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry />
        <meshPhongMaterial color="black" wireframe wireframeLinewidth={10} />
        {/* <Text fontSize={0.5} position-z={0.501} color={black}>
      text
    </Text> */}
        {props.children}
      </mesh></>
    // </TransformControls>
  )
}