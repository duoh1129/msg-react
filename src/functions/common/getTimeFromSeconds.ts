export const getTimeFromSeconds = (seconds: number) => {
  let minutes: string | number = Math.floor(seconds / 60);
  let secondsLeft: string | number = seconds % 60;
  if (minutes < 10) minutes = `0${minutes}`;
  if (secondsLeft < 10) secondsLeft = `0${secondsLeft}`;
  return `${minutes}:${secondsLeft}`;
};
