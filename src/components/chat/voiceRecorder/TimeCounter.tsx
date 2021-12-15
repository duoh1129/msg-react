import { useRef, useState } from 'react';
import React, { useEffect } from 'react';

const TimeCounter = () => {
  const [timeToShow, setTimeToShow] = useState('00:00');
  const [seconds, setSeconds] = useState(0);
  let secondsRef = useRef(0);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const secondInterval = setInterval(() => {
      if (secondsRef.current <= 58) {
        setSeconds((seconds) => seconds + 1);
        secondsRef.current = secondsRef.current + 1;
      } else {
        setSeconds(0);
        secondsRef.current = 0;
      }
    }, 1000);
    const minuteInterval = setInterval(() => {
      setMinutes((minutes) => minutes + 1);
    }, 60000);

    return () => {
      clearInterval(secondInterval);
      clearInterval(minuteInterval);
    };
  }, []);

  useEffect(() => {
    let secondsString = seconds < 10 ? `0${seconds}` : `${seconds}`;
    let minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`;
    setTimeToShow(`${minutesString}:${secondsString}`);
  }, [seconds, minutes]);

  return <>{timeToShow}</>;
};

export default TimeCounter;
