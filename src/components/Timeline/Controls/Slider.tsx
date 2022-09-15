import React, { FC, useEffect, useRef, useState } from "react";
import { Block, Elem } from "../../../utils/bem";

import "./Slider.styl";
import { Info } from "./Info";

export interface SliderProps {
  description?: string;
  info?: string;
  max:number;
  min:number;
  value:number;
  step?: number;
  onChange:(e: React.FormEvent<HTMLInputElement>) => void;
}

export const Slider: FC<SliderProps> = ({
  description,
  info,
  max,
  min,
  value,
  step,
  onChange,
  ...props
}) => {
  const sliderRef = useRef<HTMLDivElement>();
  const [inputVolumeError, setInputVolumeError] = useState(min);

  useEffect(() => {
    changeBackgroundSize();
  }, [value]);

  const changeBackgroundSize = () => {
    if(sliderRef.current)
      sliderRef.current.style.backgroundSize = ((value - min) * 100) / (max - min) + '% 100%';
  };

  const handleChangeInputValue = (e: React.FormEvent<HTMLInputElement>) => {
    setInputVolumeError(min);

    if (parseFloat(e.currentTarget.value) > max || parseFloat(e.currentTarget.value) < min) {
      setInputVolumeError(parseFloat(e.currentTarget.value));
    } else {
      onChange(e);
    }
  };

  const renderInput = () => {
    return (
      <Elem name={"volume"}>
        <Elem name="info">
          {description}
          {info && <Info text={info} />}
        </Elem>
        <Elem
          name="input-volume"
          tag="input"
          type="text"
          mod={(inputVolumeError > max || inputVolumeError < min) && { error:'volume' }}
          min={min}
          max={max}
          value={(inputVolumeError === min ) ? Math.round(value) : inputVolumeError}
          onChange={handleChangeInputValue}
        />
      </Elem>
    );
  };

  return (
    <Block name="audio-slider">
      <Elem
        ref={sliderRef}
        name="range"
        tag="input"
        type="range"
        min={min}
        max={max}
        step={step || 1}
        value={value}
        onChange={handleChangeInputValue}
      />
      {renderInput()}
    </Block>
  );
};
