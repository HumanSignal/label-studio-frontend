import { clamp } from 'lodash';
import { FC, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMemoizedHandlers } from '../../../../hooks/useMemoizedHandlers';
import { Block, Elem } from '../../../../utils/bem';
import { isDefined } from '../../../../utils/utilities';
import { TimelineViewProps } from '../../Types';
import './Frames.styl';
import { Keypoints } from './Keypoints';

const toSteps = (num: number, step: number) => {
  return Math.floor(num / step);
};

const roundToStep = (num: number, step: number) => {
  const steps = toSteps(num, step);

  return (steps * step);
};

export const Frames: FC<TimelineViewProps> = ({
  offset = 0,
  position = 1,
  length = 1024,
  step,
  playing,
  regions,
  onScroll,
  onPositionChange,
  onResize,
  onSelectRegion,
  ...props
}) => {
  const scrollMultiplier = 1.25;
  const timelineStartOffset = props.leftOffset ?? 150;

  const scrollable = useRef<HTMLDivElement>();
  const [hoverEnabled, setHoverEnabled] = useState(true);
  const [hoverOffset, setHoverOffset] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(offset);
  const [offsetY, setOffsetY] = useState(0);
  const [regionSelectionDisabled, setRegionSelectionDisabled] = useState(false);
  const viewWidth = useMemo(() => {
    return length * step;
  }, [length, step]);

  const handlers = useMemoizedHandlers({
    onPositionChange,
  });

  const background = useMemo(() => {
    const bg = [
      `repeating-linear-gradient(90deg, #fff 1px, #fff ${step-1}px, rgba(255,255,255,0) ${step-1}px, rgba(255,255,255,0) ${step+1}px)`,
      'linear-gradient(0deg, #FAFAFA, rgba(255,255,255,0) 50%)',
    ];

    return bg.join(', ');
  }, [step]);

  const setScroll = useCallback(({ left, top }) => {
    setHoverOffset(null);

    if (isDefined(top) && offsetY !== top) {
      setOffsetY(top);
    }

    if (isDefined(left) && offsetX !== left) {
      setOffsetX(left);

      const frame = toSteps(roundToStep(left, step), step);

      onScroll?.(clamp(frame + 1, 1, length));
    }
  }, [offsetX, offsetY, step]);

  const setIndicatorOffset = useCallback((value) => {
    const frame = toSteps(roundToStep(value, step), step);

    handlers.onPositionChange?.(clamp(frame + 1, 1, length));
  }, [step, length, position]);

  const scrollHandler = useCallback((e) => {
    const scroll = scrollable.current!;

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const limit = scroll.scrollWidth - scroll.clientWidth;
      const newOffsetX = clamp(offsetX + (e.deltaX * scrollMultiplier), 0, limit);

      setScroll({ left :newOffsetX });
    } else {
      const limit = scroll.scrollHeight - scroll.clientHeight;
      const newOffsetY = clamp(offsetY + (e.deltaY * scrollMultiplier), 0, limit);

      setScroll({ top: newOffsetY });
    }

  }, [scrollable, offsetX, offsetY, setScroll]);

  const currentOffsetX = useMemo(() => {
    const value = roundToStep(offsetX, step);

    return value;
  }, [offsetX, step, length]);

  const currentOffsetY = useMemo(() => {
    return offsetY;
  }, [offsetY]);

  const firstVisibleFrame = useMemo(() => {
    return Math.ceil(currentOffsetX / step);
  }, [currentOffsetX, step]);

  const lastVisibleFrame = useMemo(() => {
    const framesInView = toSteps(scrollable.current?.clientWidth ?? 0, step) - 1;

    return firstVisibleFrame + framesInView;
  }, [scrollable.current, firstVisibleFrame, step]);

  const handleMovement = useCallback((e) => {
    setHoverEnabled(false);

    const indicator = e.target;
    const startOffset = indicator.offsetLeft + currentOffsetX;
    const startMouse = e.pageX;
    const limit = scrollable.current!.scrollWidth - indicator.clientWidth;

    let lastOffset = 0;

    const onMouseMove = (e: globalThis.MouseEvent) => {
      const targetOffset = roundToStep(e.pageX - startMouse, step);
      const finalOffset = clamp(startOffset + targetOffset, 0, limit);

      if (finalOffset !== lastOffset) {
        lastOffset = finalOffset;
        setIndicatorOffset(finalOffset);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setHoverEnabled(true);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [currentOffsetX, setIndicatorOffset, step]);

  const hoverHandler = useCallback((e) => {
    if (scrollable.current) {
      const currentOffset = e.pageX - scrollable.current.getBoundingClientRect().left - timelineStartOffset;

      if (currentOffset > 0) {
        setHoverOffset(currentOffset);
      } else {
        setHoverOffset(null);
      }
    }
  }, [currentOffsetX, step]);

  const scrollClickHandler = useCallback(() => {
    if (hoverOffset) {
      setIndicatorOffset(hoverOffset + currentOffsetX);
      setHoverOffset(null);
    }
  }, [hoverOffset, currentOffsetX, step, setIndicatorOffset]);

  const seekerOffset = useMemo(() => {
    const pixelOffset = clamp(position-1, 0, length - 1) * step;
    const value = roundToStep(pixelOffset, step);

    return value - currentOffsetX + timelineStartOffset;
  }, [position, currentOffsetX, step, length]);

  const onFrameScrub = useCallback((e: MouseEvent) => {
    const dimensions = scrollable.current!.getBoundingClientRect();
    const offsetLeft = dimensions.left;
    const rightLimit = dimensions.width - timelineStartOffset;

    const getMouseToFrame = (e: MouseEvent | globalThis.MouseEvent) => {
      const mouseOffset = e.pageX - offsetLeft - timelineStartOffset;

      return mouseOffset + currentOffsetX;
    };

    const offset = getMouseToFrame(e);

    setIndicatorOffset(offset);

    const onMouseMove = (e: globalThis.MouseEvent) => {
      const offset = getMouseToFrame(e);

      if (offset >= 0 && offset <= rightLimit) {
        setHoverEnabled(false);
        setRegionSelectionDisabled(true);
        setIndicatorOffset(offset);
      }
    };

    const onMouseUp = () => {
      setHoverEnabled(true);
      setRegionSelectionDisabled(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [currentOffsetX, setIndicatorOffset]);

  useEffect(() => {
    if (scrollable.current) {
      scrollable.current.scrollLeft = currentOffsetX;
      scrollable.current.scrollTop = currentOffsetY;
    }
  }, [currentOffsetX, currentOffsetY]);

  // wheel is a passive event, so we have to add proper event to prevent default scroll
  useEffect(() => {
    const target = scrollable.current!;

    const handler = (e: globalThis.WheelEvent) => {
      const currentScroll = target.scrollTop;
      const maxScroll = target.scrollHeight - target.clientHeight;
      const horizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY);

      const { deltaY: delta } = e;

      const allowScroll = !horizontalScroll && ((currentScroll === 0 && delta < 0) || (currentScroll === maxScroll && delta > 0));

      if (!allowScroll) e.preventDefault();
    };

    target.addEventListener('wheel', handler);

    return () =>  target.removeEventListener('wheel', handler);
  }, []);

  useEffect(() => {
    onResize?.(toSteps(scrollable.current!.clientWidth, step));
  }, [viewWidth, step]);

  useEffect(() => {
    const scroll = scrollable.current;

    if (isDefined(scroll)) {
      setOffsetX(clamp(offset * step, 0, scroll.scrollWidth - scroll.clientWidth));
    }
  }, [offset, step]);

  useEffect(() => {
    if (playing && position > lastVisibleFrame) {
      setScroll({ left: lastVisibleFrame * step });
    }
  }, [playing, position]);

  const styles = {
    '--frame-size': `${step}px`,
    '--view-size': `${viewWidth}px`,
    '--offset': `${timelineStartOffset}px`,
  };

  return (
    <Block name="timeline-frames" style={styles as any}>
      <Elem name="controls">
        <Elem
          name="indicator"
          onMouseDown={handleMovement}
          style={{ left: seekerOffset }}
        />

        {isDefined(hoverOffset) && hoverEnabled && (
          <Elem
            name="hover"
            style={{ left: roundToStep(hoverOffset, step), marginLeft: timelineStartOffset }}
            data-frame={toSteps(currentOffsetX + hoverOffset, step) + 1}
          />
        )}
      </Elem>

      <Elem name="labels-bg" style={{ width: timelineStartOffset }}/>

      <Elem
        name="scroll"
        ref={scrollable as any}
        onWheel={scrollHandler}
        onMouseMove={hoverHandler}
        onMouseLeave={() => setHoverOffset(null)}
        onClickCapture={scrollClickHandler}
        onMouseDown={onFrameScrub}
      >
        <Elem name="filler">
          <KeypointsVirtual
            regions={regions}
            scrollTop={currentOffsetY}
            startOffset={timelineStartOffset}
            onSelectRegion={onSelectRegion}
            disabled={regionSelectionDisabled}
          />
        </Elem>
      </Elem>

      <Elem name="background" style={{ backgroundImage: background }}/>
    </Block>
  );
};

interface KeypointsVirtualProps {
  regions: any[];
  startOffset: number;
  scrollTop: number;
  disabled?: boolean;
  onSelectRegion: TimelineViewProps['onSelectRegion'];
}

const KeypointsVirtual: FC<KeypointsVirtualProps> = ({
  regions,
  startOffset,
  scrollTop,
  disabled,
  onSelectRegion,
}) => {
  const extra = 5;
  const height = 24;
  const bounds = useMemo(() => {
    const sIdx = clamp(Math.ceil(scrollTop / height) - 1, 0, regions.length);
    const eIdx = clamp(sIdx + (Math.ceil(165 / height) - 1), 0, regions.length);

    return [
      clamp(sIdx - extra, 0, regions.length),
      clamp(eIdx + extra, 0, regions.length),
    ];
  }, [scrollTop, regions.length]);

  return (
    <Elem name="keypoints" style={{ height: regions.length * height }}>
      {regions.map((region, i) => {
        return region.sequence.length > 0 ? (
          <Keypoints
            key={region.id}
            idx={i + 1}
            region={region}
            startOffset={startOffset}
            onSelectRegion={disabled ? undefined : onSelectRegion}
            renderable={bounds[0] <= i && i <= bounds[1]}
          />
        ) : null;
      })}
    </Elem>
  );
};
