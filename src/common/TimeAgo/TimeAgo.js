const SECS = 1000;
const MINS = 60 * SECS;

import { format, formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// to_time, [step]
const STAGES = [
  [30 * SECS, 30 * SECS],
  [44 * MINS + 30 * SECS, 1 * MINS],
  [Number.MAX_SAFE_INTEGER, 30 * MINS],
];

function * scheduleGen(value = 0) {
  let idx = STAGES.findIndex(([time]) => {
    return time > value;
  });
  const baseLimit = idx > 0 ? STAGES[idx-1][0] : 0;
  const baseStep = STAGES[idx][1];

  value = value - ((value - baseLimit) % baseStep);

  for (; idx < STAGES.length; idx++) {
    const [limit, step] = STAGES[idx];

    while (value < limit) {
      value = Math.min(limit, value + step);
      yield value;
    }
  }
}

const TimeAgo = ({ date, ...rest }) => {
  const [timestamp, forceUpdate] = useState(Date.now());
  const fromDate = useMemo(() => {
    return new Date(date);
  }, [date]);
  const ticks = useMemo(() => {
    return scheduleGen(Date.now() - fromDate);
  }, [date]);
  const timeoutId = useRef();
  const scheduleNext = useCallback(() => {
    let tick, value, tickValue;

    do {
      tick = ticks.next();
      if (!tick) return;
      value = tick.value;
      tickValue = fromDate.valueOf() + value;
    } while (tickValue < Date.now());

    timeoutId.current = setTimeout(() => {
      forceUpdate(Date.now());
    }, tickValue - Date.now());
  }, [date]);

  useEffect(() => {
    scheduleNext();
    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [date, timestamp]);

  return (
    <time
      dateTime={format(fromDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")}
      title={format(fromDate, "PPpp")}
      {...rest}
    >
      {formatDistanceToNow(fromDate, { addSuffix: true })}
    </time>
  );
};

export default TimeAgo;