import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { Block, Elem } from "../../utils/bem";

import "./TimeDurationControl.styl";
import { TimeBox } from "./TimeBox";

export interface TimerProps {
  startTime: number;
  endTime: number;
  minTime: number;
  maxTime: number;
  currentTime?: number;
  startTimeReadonly?: boolean;
  endTimeReadonly?: boolean;
  onChangeStartTime?: (value: number) => void;
  onChangeEndTime?: (value: number) => void;
}

export const TimeDurationControl: FC<TimerProps> = ({
  startTime,
  endTime,
  minTime,
  maxTime,
  currentTime,
  startTimeReadonly = false,
  endTimeReadonly = true,
  onChangeStartTime,
  onChangeEndTime,
  ...props
}) => {
  const _currentTime = !currentTime ? startTime : currentTime;

  const handleChangeCurrentTime = (value: number) => {
    if (value >= minTime && value <= maxTime && value <= endTime) onChangeStartTime?.(value);
  };

  const handleChangeEndTime = (value: number) => {
    if (value >= minTime && value <= maxTime && value >= _currentTime) onChangeEndTime?.(value);
  };

  return (
    <Block name="timer-duration-control">
      <TimeBox
        readonly={startTimeReadonly}
        value={_currentTime}
        onChange={handleChangeCurrentTime}
      />
      <TimeBox
        readonly={endTimeReadonly}
        value={endTime}
        onChange={handleChangeEndTime}
        inverted
      />
    </Block>
  );
};
