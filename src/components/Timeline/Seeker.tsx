import { clamp } from "lodash";
import { FC, useCallback } from "react";
import { Block, Elem } from "../../utils/bem";

import "./Seeker.styl";

export interface SeekerProps {
  position: number
  length: number,
  seekOffset: number,
  seekVisible: number
  onIndicatorMove: (position: number) => void
  onSeek: (position: number) => void
}

export const Seeker: FC<SeekerProps> = ({
  position,
  length,
  seekOffset,
  seekVisible,
  onIndicatorMove,
  onSeek,
}) => {
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
    const indicator = e.target;
    const startOffset = indicator.offsetLeft;
    const startDrag = e.pageX;
    const parentWidth = indicator.parentNode.clientWidth;

    const onMouseMove = (e: globalThis.MouseEvent) => {
      const limit = parentWidth - indicator.clientWidth;
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
    <Block name="seeker">
      <Elem name="track"/>
      <Elem name="indicator" style={{ left: windowOffset, width }} onMouseDown={onIndicatorDrag}/>
      <Elem name="position" style={{ left: `${seekerOffset}%` }} onMouseDown={onSeekerDrag}/>
    </Block>
  );
};
