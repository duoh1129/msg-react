export const getMessageDate = (msgTime) => {
  //set current day, month and year
  let currentTime = new Date();
  let currentDay = currentTime.getDate();
  let currentMonth = currentTime.getMonth();
  let currentYear = currentTime.getFullYear();

  //set message minute, hour, day, month and year
  let msgMinute = msgTime?.getMinutes();
  let msgHour = msgTime?.getHours();
  let msgDay = msgTime?.getDate();
  let msgMonth = msgTime?.getMonth();
  let msgYear = msgTime?.getFullYear();

  if (
    currentYear == msgYear &&
    currentMonth == msgMonth &&
    currentDay == msgDay
  ) {
    //* msg is from today
    return 'Today';
  } else if (
    currentYear == msgYear &&
    currentMonth == msgMonth &&
    currentDay == msgDay + 1
  ) {
    //* msg is from yesterday
    return 'Yesterday';
  } else if (currentYear == msgYear) {
    return `${msgDay}/${msgMonth}`;
  } else {
    //* msg is from before than yesterday
    return `${msgDay}/${msgMonth}/${msgYear}`;
  }
};
