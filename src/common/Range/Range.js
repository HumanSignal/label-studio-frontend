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
  reverse=false,
  continuous=false,
  min=0,
  max=100,
  step=1,
  size=120,
  align="horizontal",
  minIcon,
  maxIcon,
}) => {
  const initialValue = value ?? defaultValue ?? (multi ? [0, 100] : 0);
  const [currentValue, setValue] = useValueTracker(
    initialValue,
    defaultValue ?? initialValue,
  );
  let currentValueShadow = currentValue;

  const roundToStep = (value) => {
    return Math.round(value / step) * step;
  };

  const notifyOnChange = (value) => {
    if (value !== currentValueShadow) {
      onChange?.(value);
    }
  };

  const updateValue = (value, notify = true) => {
    const newValue = multi ? value.map(roundToStep) : roundToStep(value);

    if (currentValue !== newValue) {
      setValue(newValue);
      if (notify || continuous) notifyOnChange(newValue);
      currentValueShadow = newValue;
    }
  };

  const valueToPercentage = useCallback((value) => {
    const realMax = max - min;
    const realValue = value - min;

    return realValue / realMax * 100;
  }, [min, max]);

  const offsetToValue = useCallback((offset) => {
    const realMax = max - min;
    const value = clamp((realMax * (offset / size)) + min, min, max);

    return value;
  }, [min, max, size]);

  const sizeProperty = align === 'horizontal' ? 'minWidth' : 'minHeight';

  return (
    <Block name="range" mod={{ align }} style={{ [sizeProperty]: size }}>
      {reverse ? (
        maxIcon && <Elem name="icon">{maxIcon}</Elem>
      ) : (
        minIcon && <Elem name="icon">{minIcon}</Elem>
      )}
      <Elem name="body">
        <Elem name="line"></Elem>
        {multi ? currentValue.map((value, index, list) => {
          const preservedValueIndex = index === 0 ? 1 : 0;

          const getValue = (val) => {
            const result = [];
            const secondValue = currentValue[preservedValueIndex];

            result[index] = index === 0
              ? clamp(val, min, secondValue)
              : clamp(val, secondValue, max);
            result[preservedValueIndex] = currentValue[preservedValueIndex];

            return result;
          };

          return (
            <RangeHandle
              key={`handle-${index}`}
              align={align}
              value={value}
              values={list}
              bodySize={size}
              valueConvert={valueToPercentage}
              offsetConvert={offsetToValue}
              onChangePosition={(val) => updateValue(getValue(val), false)}
              onChange={(val) => updateValue(getValue(val))}
            />

          );
        }) : (
          <RangeHandle
            align={align}
            bodySize={size}
            reverse={reverse}
            value={currentValue}
            valueConvert={valueToPercentage}
            offsetConvert={offsetToValue}
            onChangePosition={(val) => updateValue(val, false)}
            onChange={(val) => updateValue(val)}
          />
        )}
      </Elem>
      {reverse ? (
        minIcon && <Elem name="icon">{minIcon}</Elem>
      ) : (
        maxIcon && <Elem name="icon">{maxIcon}</Elem>
      )}
    </Block>
  );
};

const RangeHandle = ({
  value,
  valueConvert,
  offsetConvert,
  onChangePosition,
  onChange,
  align,
  bodySize,
  reverse = false,
}) => {
  const currentOffset = valueConvert(value);
  const offsetProperty = align === 'horizontal'
    ? reverse ? 'right' : 'left'
    : reverse ? 'bottom' : 'top';
  const mouseProperty = align === 'horizontal' ? 'pageX' : 'pageY';

  const handleMouseDown = (e) => {
    const initialOffset = e[mouseProperty];
    let newValue;

    const handleMouseMove = (e) => {
      const mouseOffset = reverse
        ? initialOffset - e[mouseProperty]
        : e[mouseProperty] - initialOffset;
      const offset = clamp(mouseOffset + (currentOffset / 100 * bodySize), 0, bodySize);

      newValue = offsetConvert(offset);

      requestAnimationFrame(() => {
        onChangePosition?.(newValue);
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      onChange?.(newValue);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Elem
      name="range-handle"
      style={{ [offsetProperty]: `${valueConvert(value)}%` }}
      onMouseDownCapture={handleMouseDown}
    />
  );
};
