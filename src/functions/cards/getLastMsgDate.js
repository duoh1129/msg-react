//This function returns the lastMsg date for the ChatCard.
//? should we use the days of the week if msg is less than a week old?

export const getLastMsgDate = (parseObj) => {
  //set current day, month and year
  let currentTime = new Date();
  let currentDay = currentTime?.getDate();
  let currentMonth = currentTime?.getMonth();
  let currentYear = currentTime?.getFullYear();

  //set message minute, hour, day, month and year
  let msgTime = parseObj.get && parseObj?.get('lastMessage')?.get('createdAt');
  let msgMinute = msgTime?.getMinutes();
  let msgHour = msgTime?.getHours();
  let msgDay = msgTime?.getDate();
  let msgMonth = msgTime?.getMonth();
  let msgYear = msgTime?.getFullYear();

  if (msgTime === undefined) {
    return '';
  }
  if (
    currentYear == msgYear &&
    currentMonth == msgMonth &&
    currentDay == msgDay
  ) {
    //* msg is from today
    let msgMin = msgMinute < 10 ? `0${msgMinute}` : `${msgMinute}`;
    return `${msgHour}:${msgMin}`;
  } else if (
    currentYear == msgYear &&
    currentMonth == msgMonth &&
    currentDay == msgDay + 1
  ) {
    //* msg is from yesterday
    return 'Yesterday';
  } else {
    //* msg is from before than yesterday
    return `${msgDay}/${msgMonth}/${msgYear}`;
  }
};
