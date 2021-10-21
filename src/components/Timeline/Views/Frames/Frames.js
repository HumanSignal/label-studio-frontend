import { clamp } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Block, Elem } from "../../../../utils/bem";
import { isDefined } from "../../../../utils/utilities";
import "./Frames.styl";
import { KeyFrames } from "./KeyFrames";

const toSteps = (num, step) => {
  return Math.floor(num / step);
};

const roundToStep = (num, step) => {
  const steps = toSteps(num, step);

  return (steps * step);
};

export const Frames = ({
  step = 10,
  offset=0,
  position = 1,
  length = 1024,
  regions,
  onScroll,
  onChange,
  onResize,
  onToggleVisibility,
  onDeleteRegion,
  onSelectRegion,
}) => {
  const scrollMultiplier = 1.25;

  const scrollable = useRef();
  const [hoverOffset, setHoverOffset] = useState(null);
  const [offsetX, setOffsetX] = useState(offset);
  const [offsetY, setOffsetY] = useState(0);
  const [seekerPosition, setSeekerPosition] = useState(0);
  const viewWidth = useMemo(() => {
    return length * step;
  }, [length, step]);

  const background = useMemo(() => {
    const bg = [
      `repeating-linear-gradient(90deg, #fff 1px, #fff ${step-1}px, transparent ${step-1}px, transparent ${step+1}px)`,
      `linear-gradient(0deg, #FAFAFA, transparent 50%)`,
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
    setSeekerPosition(value);

    const frame = toSteps(roundToStep(value, step), step);

    onChange?.(clamp(frame + 1, 1, length));
  }, [step, length]);

  const scrollHandler = useCallback((e) => {
    const scroll = scrollable.current;

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

  const handleMovement = useCallback((e) => {
    const indicator = e.target;
    const startOffset = indicator.offsetLeft + currentOffsetX;
    const startMouse = e.pageX;
    const limit = scrollable.current.scrollWidth - indicator.clientWidth;

    const onMouseMove = (e) => {
      const targetOffset = e.pageX - startMouse;
      const finalOffset = clamp(startOffset + targetOffset, 0, limit);

      setIndicatorOffset(finalOffset);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [currentOffsetX, step, setIndicatorOffset]);

  const hoverHandler = useCallback((e) => {
    const offset = roundToStep(e.pageX - scrollable.current.getBoundingClientRect().left, step);

    setHoverOffset(offset);
  }, [currentOffsetX, step]);

  const scrollClickHandler = useCallback((e) => {
    const offset = roundToStep(e.pageX - scrollable.current.getBoundingClientRect().left, step);

    setIndicatorOffset(offset + currentOffsetX);
    setHoverOffset(null);
  }, [currentOffsetX, step]);

  const seekerOffset = useMemo(() => {
    const value = roundToStep(seekerPosition, step);

    return value - currentOffsetX;
  }, [seekerPosition, currentOffsetX, step, length]);

  useEffect(() => {
    if (scrollable.current) {
      scrollable.current.scrollLeft = currentOffsetX;
      scrollable.current.scrollTop = currentOffsetY;
    }
  }, [currentOffsetX, currentOffsetY]);

  useEffect(() => {
    const handler = (e) => e.preventDefault();

    scrollable.current.addEventListener('wheel', handler);

    return () => scrollable.current.removeEventListener('wheel', handler);
  }, []);

  useEffect(() => {
    onResize?.(toSteps(scrollable.current.clientWidth, step));
  }, [viewWidth, step]);

  useEffect(() => {
    setSeekerPosition(clamp(position-1, 0, length - 1) * step);
  }, [position, step]);

  useEffect(() => {
    setOffsetX(offset * step);
  }, [offset, step]);

  const styles = {
    "--frame-size": `${step}px`,
    "--view-size": `${viewWidth}px`,
  };

  return (
    <Block name="timeline-frames" style={styles}>
      <Elem
        name="indicator"
        onMouseDown={handleMovement}
        style={{ left: seekerOffset }}
      />

      {isDefined(hoverOffset) && (
        <Elem
          name="hover"
          style={{ left: hoverOffset }}
        />
      )}

      <Elem
        name="scroll"
        ref={scrollable}
        onWheel={scrollHandler}
        onMouseMove={hoverHandler}
        onMouseLeave={() => setHoverOffset(null)}
        onClick={scrollClickHandler}
        style={{ backgroundImage: background }}
      >
        <Elem name="filler"/>

        <Elem name="keyframes">
          {regions.map(region => (
            <KeyFrames
              key={region.id}
              step={step}
              region={region}
              onSelectRegion={onSelectRegion}
              onToggleVisibility={onToggleVisibility}
              onDeleteRegion={onDeleteRegion}
            />
          ))}
        </Elem>
      </Elem>
    </Block>
  );
};
