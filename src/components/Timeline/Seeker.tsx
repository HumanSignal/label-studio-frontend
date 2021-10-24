import { clamp } from "lodash";
import { FC, ReactElement, useCallback, useRef } from "react";
import { Block, Elem } from "../../utils/bem";
import { TimelineMinimapProps } from "./Types";

import "./Seeker.styl";

export interface SeekerProps {
  position: number;
  length: number;
  seekOffset: number;
  seekVisible: number;
  minimap?: ReactElement<TimelineMinimapProps> | null;
  onIndicatorMove: (position: number) => void;
  onSeek: (position: number) => void;
}

export const Seeker: FC<SeekerProps> = ({
  position,
  length,
  seekOffset,
  seekVisible,
  onIndicatorMove,
  onSeek,
  minimap,
}) => {
  const root = useRef<HTMLDivElement>();
  const indicator = useRef<HTMLDivElement>();

  const width = `${seekVisible / length * 100}%`;
  const offsetLimit = length - seekVisible;
  const windowOffset = `${Math.min(seekOffset, offsetLimit) / length * 100}%`;
  const seekerOffset = position / length * 100;

  const onIndicatorDrag = useCallback((e) => {
    const indicator = e.target;
    const startOffset = indicator.offsetLeft;
    const startDrag = e.pageX;
    const parentWidth = indicator.parentNode.clientWidth;

    const onMouseMove = (e: globalThis.MouseEvent) => {
      const limit = parentWidth - indicator.clientWidth;
      const newOffset = clamp(startOffset + (e.pageX - startDrag), 0, limit);
      const percent = newOffset / parentWidth;

      onIndicatorMove?.(Math.ceil(length * percent));
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [length]);

  const onSeekerDrag = useCallback((e) => {
    const startDrag = e.pageX;
    const dimensions = root.current!.getBoundingClientRect();
    const indicatorWidth = indicator.current!.clientWidth;
    const startOffset = e.pageX - dimensions.left;
    const parentWidth = dimensions.width;

    onSeek?.(Math.ceil(length * (startOffset / parentWidth)));

    const onMouseMove = (e: globalThis.MouseEvent) => {
      const limit = parentWidth - indicatorWidth;
      const newOffset = clamp(startOffset + (e.pageX - startDrag), 0, limit);
      const percent = newOffset / parentWidth;

      onSeek?.(Math.ceil(length * percent));
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [length]);

  return (
    <Block name="seeker" ref={root} onMouseDown={onSeekerDrag}>
      <Elem name="track"/>
      <Elem name="indicator" style={{ left: windowOffset, width }} onMouseDown={onIndicatorDrag}/>
      <Elem name="position" ref={indicator} style={{ left: `${seekerOffset}%` }}/>
      <Elem name="minimap">{minimap}</Elem>
    </Block>
  );
};
