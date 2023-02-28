import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './multiRangeSlider.css';

const MultiRangeSlider = ({ min, max, onChange }) => {
  const [minVal, setMinVal] = useState(min);
  const [maxVal, setMaxVal] = useState(max);
  const minValRef = useRef(min);
  const maxValRef = useRef(max);
  const range = useRef(null);

  // Convert to percentage
  const getPercent = useCallback(
    (value) => Math.round(((value - min) / (max - min)) * 100),
    [min, max],
  );

  // Set width of the range to decrease from the left side
  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxValRef.current);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, getPercent]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, getPercent]);

  // Get min and max values when their state changes
  useEffect(() => {
    onChange({ min: minVal, max: maxVal });
  }, [minVal, maxVal, onChange]);

  return (
    <>
      <div className='mrs_container'>
        {'Y axis range'}
      </div>
      <div className='mrs_container'>
        <input
          type='range'
          min={min}
          max={max}
          value={minVal}
          onChange={(event) => {
            const value = Math.min(Number(event.target.value), maxVal - 1);

            setMinVal(value);
            minValRef.current = value;
          }}
          className='mrs_thumb mrs_thumb--left'
          style={{ zIndex: minVal > max - 100 && '5' }} />
        <input
          type='range'
          min={min}
          max={max}
          value={maxVal}
          onChange={(event) => {
            const value = Math.max(Number(event.target.value), minVal + 1);

            setMaxVal(value);
            maxValRef.current = value;
          }}
          className='mrs_thumb mrs_thumb--right' />

        <div className='mrs_slider'>
          <div className='mrs_slider__track' />
          <div ref={range} className='mrs_slider__range' />
          <div className='mrs_slider__left-value'>{minVal}</div>
          <div className='mrs_slider__right-value'>{maxVal}</div>
        </div>
      </div>
    </>
  );
};

MultiRangeSlider.propTypes = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default MultiRangeSlider;
