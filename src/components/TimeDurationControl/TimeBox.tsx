import React, { FC, useCallback, useEffect, useState } from 'react';
import { Block, Elem } from '../../utils/bem';

import './TimeBox.styl';

export interface TimerProps {
  sidepanel: boolean;
  value: number | undefined;
  readonly?: boolean;
  inverted?: boolean;
  onChange: (value: number) => void;
}

export const TimeBox: FC<TimerProps> = ({
  sidepanel = false,
  value,
  inverted = false,
  readonly = false,
  onChange,
}) => {
  const inputRef = React.createRef<HTMLInputElement>();
  const [inputIsVisible, setInputVisible] = useState(false);
  const [currentDisplayedTime, setCurrentDisplayedTime] = useState(value);
  const [currentInputTime, setCurrentInputTime] = useState<string | number | undefined>(value);
  const [inputSelectionStart, setInputSelectionStart] = useState<number | null>(null);

  useEffect(() => {
    setCurrentDisplayedTime(value);
  }, [value]);

  useEffect(() => {
    if (inputSelectionStart !== null)
      inputRef?.current?.setSelectionRange(inputSelectionStart, inputSelectionStart);
  }, [currentInputTime, inputSelectionStart]);

  const formatPosition = useCallback((time: number): string => {
    const roundedFps = Math.round(999).toString();
    const fpsMs = 1;
    const currentSecond = (time * 1000) % 1000;
    const result = Math.round(currentSecond / fpsMs).toString();

    return result.padStart(roundedFps.length, '0');
  }, []);

  const formatTime = useCallback((time: number, input = false): any => {
    const timeDate = new Date(time * 1000).toISOString();
    let formatted = time > 3600
      ? timeDate.substr(11, 8)
      : timeDate.substr(14, 5);

    if (input) {
      formatted = timeDate.substr(14, 9).replace('.', ':');
    }

    return formatted;
  }, []);

  const convertTextToTime = (value: string) => {
    const splittedValue = value.split(':');
    const min = parseFloat(splittedValue[0]) * 60;
    const sec = parseFloat(splittedValue[1]);
    const milisec = parseFloat(splittedValue[2]) / 1000;

    onChange(min + sec + milisec);
  };

  const handleClickToInput = () => {
    if(!readonly) setInputVisible(true);
  };

  const handleBlurInput = (e: React.FormEvent<HTMLInputElement>) => {
    const splittedValue = e.currentTarget.value.split(':');
    const sec = parseFloat(splittedValue[1]);
    let min = parseFloat(splittedValue[0]);


    if (sec >= 60) {
      min += Math.floor(sec / 60);
      splittedValue[1] = `${sec % 60}`;
    }

    splittedValue[0] = min.toString().length === 1 ? `0${min.toString()}` : `${min}`;

    setInputVisible(false);

    convertTextToTime(splittedValue.join(':'));
  };

  const handleFocusInput = () => {
    setCurrentInputTime(formatTime(currentDisplayedTime || 0, true));
  };

  const handleChangeInput = (e: React.FormEvent<HTMLInputElement>) => {
    let input = e.currentTarget.value;
    let selectionStart = e.currentTarget.selectionStart;

    if (input.length === selectionStart) selectionStart = null;

    setInputSelectionStart(selectionStart);

    input = input.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1:$2')
      .replace(/(\d{2})(\d)/, '$1:$2');

    setCurrentInputTime(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget?.blur?.();
    }
  };

  const renderInputTime = () => {
    return (
      <Elem name={'input-time'}
        maxLength={9}
        tag={'input'}
        autoFocus
        ref={inputRef}
        type="text"
        value={ currentInputTime }
        onKeyDown={handleKeyDown}
        onChange={handleChangeInput}
        onFocus={handleFocusInput}
        onBlur={handleBlurInput} />
    );
  };

  const renderDisplayedTime = () => {
    return (
      <Elem name={'displayed-time'}
        onClick={handleClickToInput}
      >
        {formatTime(currentDisplayedTime || 0)}:<span>{formatPosition(currentDisplayedTime || 0)}</span>
      </Elem>
    );
  };

  return (
    <Block name="time-box" mod={{ inverted, sidepanel }}>
      {inputIsVisible ?
        renderInputTime() : renderDisplayedTime()
      }
    </Block>
  );
};
