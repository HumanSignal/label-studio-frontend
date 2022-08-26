import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { Block, Elem } from "../../utils/bem";

import "./TimerComponent.styl";

export interface TimerProps {
  maxTime: number;
  minTime: number;
  currentTime?: number;
}

export const TimerComponent: FC<TimerProps> = ({
  maxTime,
  minTime,
  currentTime,
  ...props
}) => {
  const formatPosition = useCallback((time: number): string => {
    const value = time.toString();
    const formatedSplit = value.split('.');
    const formatedValue = [];

    return value.toString().padStart(3, '0');
  }, []);

  return (
    <Block name="timer-component">
      {formatPosition(currentTime || 0)} / {formatPosition(maxTime)}

      <Elem/>
    </Block>
  );
};
