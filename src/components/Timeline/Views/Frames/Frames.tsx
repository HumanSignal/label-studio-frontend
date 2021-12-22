import { clamp } from "lodash";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Block, Elem } from "../../../../utils/bem";
import { isDefined } from "../../../../utils/utilities";
import { TimelineViewProps } from "../../Types";
import "./Frames.styl";
import { Keypoints } from "./Keypoints";

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
  onChange,
  onResize,
  onToggleVisibility,
  onDeleteRegion,
  onSelectRegion,
}) => {
  const scrollMultiplier = 1.25;
  const timelineStartOffset = 150;

  const scrollable = useRef<HTMLDivElement>();
  const [hoverEnabled, setHoverEnabled] = useState(true);
  const [hoverOffset, setHoverOffset] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(offset);
  const [offsetY, setOffsetY] = useState(0);
  const viewWidth = useMemo(() => {
    return length * step;
  }, [length, step]);

  const background = useMemo(() => {
    const bg = [
      `repeating-linear-gradient(90deg, #fff 1px, #fff ${step-1}px, rgba(255,255,255,0) ${step-1}px, rgba(255,255,255,0) ${step+1}px)`,
      `linear-gradient(0deg, #FAFAFA, rgba(255,255,255,0) 50%)`,
    ];

    return bg.join(", ");
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

    onChange?.(clamp(frame + 1, 1, length));
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

  const timelineOffsetSteps = roundToStep(timelineStartOffset, step);

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
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setHoverEnabled(true);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
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
    "--frame-size": `${step}px`,
    "--view-size": `${viewWidth}px`,
    "--offset": `${timelineStartOffset}px`,
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
      >
        <Elem name="filler">
          <Elem name="keypoints">
            {regions.map(region => region.sequence.length > 0 ? (
              <Keypoints
                key={region.id}
                region={region}
                startOffset={timelineStartOffset}
                onSelectRegion={onSelectRegion}
              />
            ) : null)}
          </Elem>
        </Elem>
      </Elem>

      <Elem name="background" style={{ backgroundImage: background }}/>
    </Block>
  );
};
