import { useCallback } from "react";
import { Block, Elem } from "../../utils/bem";
import { clamp } from "../../utils/utilities";
import { useValueTracker } from "../Utils/useValueTracker";
import "./Range.styl";

export const Range = ({
  value,
  defaultValue,
  onChange,
  multi=false,
  min=0,
  max=100,
  step=1,
}) => {
  const initialValue = value ?? defaultValue ?? (multi ? [0, 100] : 0);
  const [currentValue, setValue] = useValueTracker(
    initialValue,
    defaultValue ?? initialValue,
  );

  const updateValue = useCallback((value) => {
    setValue(value);
    onChange?.(value);
  }, [currentValue]);

  const valueToPercentage = useCallback((value) => {
    const realMax = max - min;
    const realValue = value - min;

    return realValue / realMax * 100;
  }, [min, max]);

  const offsetToValue = useCallback((offset) => {
    const realMax = max - min;
    const value = clamp((realMax * (offset / 120)) + min, min, max);

    return value;
  }, [min, max]);

  return (
    <Block name="range">
      <Elem name="body">
        <Elem name="line"></Elem>
        {multi ? currentValue.map((value, index, list) => {
          const preservedValueIndex = index === 0 ? 1 : 0;

          return (
            <RangeHandle
              key={`handle-${index}`}
              value={value}
              values={list}
              valueConvert={valueToPercentage}
              offsetConvert={offsetToValue}
              onChange={(val) => {
                const result = [];

                result[index] = val;
                result[preservedValueIndex] = currentValue[preservedValueIndex];

                updateValue(result);
              }}
            />

          );
        }) : (
          <RangeHandle
            value={currentValue}
            valueConvert={valueToPercentage}
            offsetConvert={offsetToValue}
            onChange={(val) => updateValue(val)}
          />
        )}
      </Elem>
    </Block>
  );
};

const RangeHandle = ({
  value,
  valueConvert,
  offsetConvert,
  onChange,
}) => {
  const handleMouseDown = useCallback((e) => {
    const initialOffset = e.pageX;

    const handleMouseMove = (e) => {
      const offset = e.pageX - initialOffset;

      onChange?.(offsetConvert(offset));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <Elem
      name="range-handle"
      style={{ left: `${valueConvert(value)}%` }}
      onMouseDownCapture={handleMouseDown}
    />
  );
};
